<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\CategoryField;
use App\Http\Resources\CategoryResource;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    /**
     * Get all categories (with optional filtering)
     */
    public function index(Request $request)
    {
        $query = Category::with('fields');

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by status
        if ($request->has('active')) {
            $query->where('is_active', $request->active === 'true');
        }

        // Search by name
        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%$search%");
        }

        $categories = $query->paginate($request->get('per_page', 15));

        return CategoryResource::collection($categories);
    }

    /**
     * Get single category with its fields
     */
    public function show(Category $category)
    {
        return new CategoryResource($category->load('fields'));
    }

    /**
     * Create new category with fields
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:perbaikan,zoom_meeting',
            'description' => 'nullable|string',
            'assigned_roles' => 'required|array|min:1',
            'assigned_roles.*' => Rule::in(['super_admin', 'admin_layanan', 'admin_penyedia', 'teknisi', 'pegawai']),
            'is_active' => 'boolean',
            'fields' => 'array',
            'fields.*.name' => 'required|string',
            'fields.*.label' => 'required|string',
            'fields.*.type' => 'required|in:text,textarea,number,select,file,date,email,checkbox,radio',
            'fields.*.required' => 'boolean',
            'fields.*.options' => 'array',
            'fields.*.help_text' => 'nullable|string',
            'fields.*.order' => 'integer',
        ]);

        // Create category
        $category = Category::create([
            'name' => $validated['name'],
            'type' => $validated['type'],
            'description' => $validated['description'] ?? null,
            'assigned_roles' => $validated['assigned_roles'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        // Create fields
        if (isset($validated['fields'])) {
            foreach ($validated['fields'] as $index => $fieldData) {
                CategoryField::create([
                    'category_id' => $category->id,
                    'name' => $fieldData['name'],
                    'label' => $fieldData['label'],
                    'type' => $fieldData['type'],
                    'required' => $fieldData['required'] ?? false,
                    'options' => $fieldData['options'] ?? null,
                    'help_text' => $fieldData['help_text'] ?? null,
                    'order' => $fieldData['order'] ?? $index,
                ]);
            }
        }

        // Audit log
        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'CATEGORY_CREATED',
            'details' => "Category created: {$category->name}",
            'ip_address' => request()->ip(),
        ]);

        return response()->json(new CategoryResource($category->load('fields')), 201);
    }

    /**
     * Update category
     */
    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'description' => 'nullable|string',
            'assigned_roles' => 'array|min:1',
            'assigned_roles.*' => Rule::in(['super_admin', 'admin_layanan', 'admin_penyedia', 'teknisi', 'pegawai']),
            'is_active' => 'boolean',
            'fields' => 'array',
            'fields.*.id' => 'integer|exists:category_fields,id',
            'fields.*.name' => 'required|string',
            'fields.*.label' => 'required|string',
            'fields.*.type' => 'required|in:text,textarea,number,select,file,date,email,checkbox,radio',
            'fields.*.required' => 'boolean',
            'fields.*.options' => 'array',
            'fields.*.help_text' => 'nullable|string',
            'fields.*.order' => 'integer',
        ]);

        // Update category
        $category->update([
            'name' => $validated['name'] ?? $category->name,
            'description' => $validated['description'] ?? $category->description,
            'assigned_roles' => $validated['assigned_roles'] ?? $category->assigned_roles,
            'is_active' => $validated['is_active'] ?? $category->is_active,
        ]);

        // Update fields
        if (isset($validated['fields'])) {
            // Delete fields not in request
            $fieldIds = array_column($validated['fields'], 'id');
            CategoryField::where('category_id', $category->id)
                ->whereNotIn('id', $fieldIds)
                ->delete();

            // Create or update fields
            foreach ($validated['fields'] as $index => $fieldData) {
                if (isset($fieldData['id'])) {
                    CategoryField::where('id', $fieldData['id'])->update([
                        'name' => $fieldData['name'],
                        'label' => $fieldData['label'],
                        'type' => $fieldData['type'],
                        'required' => $fieldData['required'] ?? false,
                        'options' => $fieldData['options'] ?? null,
                        'help_text' => $fieldData['help_text'] ?? null,
                        'order' => $fieldData['order'] ?? $index,
                    ]);
                } else {
                    CategoryField::create([
                        'category_id' => $category->id,
                        'name' => $fieldData['name'],
                        'label' => $fieldData['label'],
                        'type' => $fieldData['type'],
                        'required' => $fieldData['required'] ?? false,
                        'options' => $fieldData['options'] ?? null,
                        'help_text' => $fieldData['help_text'] ?? null,
                        'order' => $fieldData['order'] ?? $index,
                    ]);
                }
            }
        }

        // Audit log
        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'CATEGORY_UPDATED',
            'details' => "Category updated: {$category->name}",
            'ip_address' => request()->ip(),
        ]);

        return new CategoryResource($category->load('fields'));
    }

    /**
     * Delete category (soft delete concept - set is_active to false)
     */
    public function destroy(Category $category)
    {
        $categoryName = $category->name;
        $category->delete(); // Hard delete - can change to soft delete if needed

        // Audit log
        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'CATEGORY_DELETED',
            'details' => "Category deleted: {$categoryName}",
            'ip_address' => request()->ip(),
        ]);

        return response()->json(['message' => 'Category deleted successfully']);
    }

    /**
     * Get categories by type (for frontend)
     */
    public function getByType($type)
    {
        $category = Category::ofType($type)->active()->with('fields')->get();
        return CategoryResource::collection($category);
    }

    /**
     * Get available field types
     */
    public function getFieldTypes()
    {
        return response()->json([
            'fieldTypes' => CategoryField::getTypes(),
        ]);
    }

    /**
     * Get category types
     */
    public function getCategoryTypes()
    {
        return response()->json([
            'categoryTypes' => Category::getTypes(),
        ]);
    }
}
