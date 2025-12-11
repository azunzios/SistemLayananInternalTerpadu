<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\ZoomAccount;

class ZoomAccountSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            [
                'account_id' => 'zoom1',
                'name' => 'Akun Zoom 1',
                'email' => 'zoom1@bps-ntb.go.id',
                'host_key' => '123456',
                'plan_type' => 'Pro',
                'max_participants' => 100,
                'description' => 'Akun utama untuk meeting rutin dan keperluan umum',
                'color' => 'blue',
                'is_active' => true,
            ],
            [
                'account_id' => 'zoom2',
                'name' => 'Akun Zoom 2',
                'email' => 'zoom2@bps-ntb.go.id',
                'host_key' => '234567',
                'plan_type' => 'Pro',
                'max_participants' => 100,
                'description' => 'Akun cadangan untuk meeting simultan',
                'color' => 'purple',
                'is_active' => true,
            ],
            [
                'account_id' => 'zoom3',
                'name' => 'Akun Zoom 3',
                'email' => 'zoom3@bps-ntb.go.id',
                'host_key' => '345678',
                'plan_type' => 'Business',
                'max_participants' => 300,
                'description' => 'Akun untuk webinar dan meeting besar',
                'color' => 'green',
                'is_active' => true,
            ],
        ];

        foreach ($accounts as $account) {
            ZoomAccount::updateOrCreate(
                ['account_id' => $account['account_id']],
                $account
            );
        }
    }
}
