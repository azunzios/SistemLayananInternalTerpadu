<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;

class BmnAssetImportController extends Controller
{
    /**
     * Import assets dari Excel file
     * POST /bmn-assets/import
     */
    public function importExcel(Request $request)
    {
        // Check super admin
        $user = auth()->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }
        
        // Check if user has super_admin role
        $activeRole = $user->role ?? 'pegawai';
        if ($activeRole !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only super admin can check import status.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls|max:10240', // 10MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $file = $request->file('file');
        
        try {
            $spreadsheet = IOFactory::load($file->getRealPath());
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();
            
            // Remove header row
            $header = array_shift($rows);
            
            // Normalize header: trim, lowercase, replace spaces with underscore
            $normalizedHeader = array_map(function($h) {
                return str_replace(' ', '_', strtolower(trim($h)));
            }, $header);
            
            // Expected header columns
            $expectedColumns = ['kode_satker', 'nama_satker', 'kode_barang', 'nama_barang', 'nup', 'kondisi', 'merek', 'ruangan', 'serial_number', 'pengguna'];
            
            // Create column mapping
            $columnMap = [];
            foreach ($expectedColumns as $col) {
                $index = array_search($col, $normalizedHeader);
                if ($index === false) {
                    return response()->json([
                        'success' => false,
                        'message' => "Header tidak valid. Kolom '{$col}' tidak ditemukan.",
                        'expected' => $expectedColumns,
                        'found' => $normalizedHeader,
                    ], 422);
                }
                $columnMap[$col] = $index;
            }
            
            $imported = 0;
            $skipped = 0;
            $errors = [];

            DB::beginTransaction();
            
            foreach ($rows as $index => $row) {
                $lineNumber = $index + 2; // +2 karena header di line 1, data mulai line 2
                
                // Skip empty rows
                if (empty(array_filter($row))) {
                    continue;
                }
                
                // Map data using column mapping
                $data = [
                    'kode_satker' => isset($row[$columnMap['kode_satker']]) ? trim($row[$columnMap['kode_satker']]) : '',
                    'nama_satker' => isset($row[$columnMap['nama_satker']]) ? trim($row[$columnMap['nama_satker']]) : '',
                    'kode_barang' => isset($row[$columnMap['kode_barang']]) ? trim($row[$columnMap['kode_barang']]) : '',
                    'nama_barang' => isset($row[$columnMap['nama_barang']]) ? trim($row[$columnMap['nama_barang']]) : '',
                    'nup' => isset($row[$columnMap['nup']]) ? trim($row[$columnMap['nup']]) : '',
                    'kondisi' => isset($row[$columnMap['kondisi']]) ? trim($row[$columnMap['kondisi']]) : '',
                    'merek' => isset($row[$columnMap['merek']]) ? trim($row[$columnMap['merek']]) : '',
                    'ruangan' => isset($row[$columnMap['ruangan']]) && !empty(trim($row[$columnMap['ruangan']])) ? trim($row[$columnMap['ruangan']]) : null,
                    'serial_number' => isset($row[$columnMap['serial_number']]) && !empty(trim($row[$columnMap['serial_number']])) ? trim($row[$columnMap['serial_number']]) : null,
                    'pengguna' => isset($row[$columnMap['pengguna']]) && !empty(trim($row[$columnMap['pengguna']])) ? trim($row[$columnMap['pengguna']]) : null,
                ];
                
                // Validate required fields
                if (empty($data['kode_barang']) || empty($data['nup'])) {
                    $errors[] = "Baris {$lineNumber}: kode_barang dan nup wajib diisi";
                    $skipped++;
                    continue;
                }
                
                // Normalize dan validate kondisi (case-insensitive)
                $kondisiMap = [
                    'baik' => 'Baik',
                    'rusak ringan' => 'Rusak Ringan',
                    'rusak berat' => 'Rusak Berat',
                ];
                
                $kondisiLower = strtolower($data['kondisi']);
                if (!isset($kondisiMap[$kondisiLower])) {
                    $errors[] = "Baris {$lineNumber}: kondisi '{$data['kondisi']}' tidak valid. Harus: Baik, Rusak Ringan, atau Rusak Berat";
                    $skipped++;
                    continue;
                }
                
                // Normalize kondisi ke format yang benar
                $data['kondisi'] = $kondisiMap[$kondisiLower];
                
                // Check duplicate
                $exists = Asset::where('kode_barang', $data['kode_barang'])
                    ->where('nup', $data['nup'])
                    ->exists();
                
                if ($exists) {
                    $errors[] = "Baris {$lineNumber}: Asset dengan kode_barang {$data['kode_barang']} dan NUP {$data['nup']} sudah ada";
                    $skipped++;
                    continue;
                }
                
                // Create asset
                Asset::create($data);
                $imported++;
            }
            
            DB::commit();
            
            // Audit log
            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'import_assets',
                'model_type' => 'Asset',
                'model_id' => null,
                'changes' => [
                    'imported' => $imported,
                    'skipped' => $skipped,
                    'filename' => $file->getClientOriginalName(),
                ],
            ]);
            
            return response()->json([
                'success' => true,
                'message' => "Import selesai. {$imported} data berhasil diimport, {$skipped} data dilewati",
                'data' => [
                    'imported' => $imported,
                    'skipped' => $skipped,
                    'errors' => $errors,
                ],
            ], 200);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Import gagal: ' . $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Download template Excel
     * GET /bmn-assets/template
     */
    public function downloadTemplate()
    {
        // Check super admin
        $user = auth()->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }
        
        // Check if user has super_admin role
        $activeRole = $user->role ?? 'pegawai';
        if ($activeRole !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only super admin can download template.',
            ], 403);
        }
        
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        
        // Set header
        $sheet->setCellValue('A1', 'kode_satker');
        $sheet->setCellValue('B1', 'nama_satker');
        $sheet->setCellValue('C1', 'kode_barang');
        $sheet->setCellValue('D1', 'nama_barang');
        $sheet->setCellValue('E1', 'nup');
        $sheet->setCellValue('F1', 'kondisi');
        $sheet->setCellValue('G1', 'merek');
        $sheet->setCellValue('H1', 'ruangan');
        $sheet->setCellValue('I1', 'serial_number');
        $sheet->setCellValue('J1', 'pengguna');
        
        // Set header style (bold)
        $sheet->getStyle('A1:J1')->getFont()->setBold(true);
        
        // Sample data
        $sheet->setCellValue('A2', '0540123004292690');
        $sheet->setCellValue('B2', 'BPS Provinsi NTB');
        $sheet->setCellValue('C2', '3100102001');
        $sheet->setCellValue('D2', 'P C Unit');
        $sheet->setCellValue('E2', '118');
        $sheet->setCellValue('F2', 'Baik');
        $sheet->setCellValue('G2', 'Dell Optiplex 3010 DT');
        $sheet->setCellValue('H2', 'Ruang TI');
        $sheet->setCellValue('I2', 'SN123456');
        $sheet->setCellValue('J2', 'John Doe');
        
        // Auto-size columns
        foreach (range('A', 'J') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
        
        // Write file
        $writer = new Xlsx($spreadsheet);
        
        $filename = 'template_asset_bmn.xlsx';
        $tempFile = tempnam(sys_get_temp_dir(), 'template_');
        $writer->save($tempFile);
        
        return response()->download($tempFile, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    /**
     * Export all assets ke Excel
     * GET /bmn-assets/export
     */
    public function exportAll()
    {
        // Check super admin
        $user = auth()->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }
        
        // Check if user has super_admin role (roles is JSON array)
        $roles = is_string($user->roles) ? json_decode($user->roles, true) : $user->roles;
        if (!in_array('super_admin', $roles ?? [])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only super admin can export assets.',
            ], 403);
        }
        
        // Get all assets
        $assets = Asset::all();
        
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        
        // Set header
        $sheet->setCellValue('A1', 'kode_satker');
        $sheet->setCellValue('B1', 'nama_satker');
        $sheet->setCellValue('C1', 'kode_barang');
        $sheet->setCellValue('D1', 'nama_barang');
        $sheet->setCellValue('E1', 'nup');
        $sheet->setCellValue('F1', 'kondisi');
        $sheet->setCellValue('G1', 'merek');
        $sheet->setCellValue('H1', 'ruangan');
        $sheet->setCellValue('I1', 'serial_number');
        $sheet->setCellValue('J1', 'pengguna');
        
        // Set header style (bold)
        $sheet->getStyle('A1:J1')->getFont()->setBold(true);
        
        // Add data
        $row = 2;
        foreach ($assets as $asset) {
            $sheet->setCellValue('A' . $row, $asset->kode_satker);
            $sheet->setCellValue('B' . $row, $asset->nama_satker);
            $sheet->setCellValue('C' . $row, $asset->kode_barang);
            $sheet->setCellValue('D' . $row, $asset->nama_barang);
            $sheet->setCellValue('E' . $row, $asset->nup);
            $sheet->setCellValue('F' . $row, $asset->kondisi);
            $sheet->setCellValue('G' . $row, $asset->merek);
            $sheet->setCellValue('H' . $row, $asset->ruangan);
            $sheet->setCellValue('I' . $row, $asset->serial_number);
            $sheet->setCellValue('J' . $row, $asset->pengguna);
            $row++;
        }
        
        // Auto-size columns
        foreach (range('A', 'J') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
        
        // Write file
        $writer = new Xlsx($spreadsheet);
        
        $filename = 'asset_bmn_' . date('Y-m-d_H-i-s') . '.xlsx';
        $tempFile = tempnam(sys_get_temp_dir(), 'export_');
        $writer->save($tempFile);
        
        // Audit log
        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'export_assets',
            'model_type' => 'Asset',
            'model_id' => null,
            'changes' => [
                'total_exported' => count($assets),
            ],
        ]);
        
        return response()->download($tempFile, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }
}
