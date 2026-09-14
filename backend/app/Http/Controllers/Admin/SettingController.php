<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        return response()->json([
            'platform_name' => Setting::getValue('platform_name', 'TIKTIK'),
            'platform_logo' => Setting::getValue('platform_logo', ''),
            'whatsapp_contact' => Setting::getValue('whatsapp_contact', ''),
            'maintenance_mode' => Setting::getValue('maintenance_mode', 'false'),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'platform_name' => 'sometimes|string|max:100',
            'whatsapp_contact' => 'sometimes|string|max:20',
        ]);

        foreach ($validated as $key => $value) {
            Setting::setValue($key, $value);
        }

        if ($request->hasFile('platform_logo')) {
            $path = $request->file('platform_logo')->store('settings', 'public');
            Setting::setValue('platform_logo', '/storage/' . $path);
        }

        ActivityLog::log('admin.settings.update', 'Platform settings updated');

        return response()->json(['message' => 'Pengaturan berhasil diperbarui.']);
    }

    public function toggleMaintenance()
    {
        $current = Setting::getValue('maintenance_mode', 'false');
        $newValue = $current === 'true' ? 'false' : 'true';
        Setting::setValue('maintenance_mode', $newValue);

        ActivityLog::log('admin.maintenance.toggle', "Maintenance mode: {$newValue}");

        return response()->json([
            'message' => 'Maintenance mode ' . ($newValue === 'true' ? 'diaktifkan' : 'dinonaktifkan'),
            'maintenance_mode' => $newValue,
        ]);
    }
}
