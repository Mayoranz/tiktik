<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Setting;

class CheckMaintenanceMode
{
    /**
     * Block all non-admin requests when maintenance mode is active.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $maintenanceMode = Setting::getValue('maintenance_mode', 'false');

        if ($maintenanceMode === 'true') {
            // Allow admin users through
            if ($request->user() && $request->user()->isAdmin()) {
                return $next($request);
            }

            return response()->json([
                'message' => 'Platform sedang dalam maintenance. Silakan coba lagi nanti.',
                'maintenance' => true,
            ], 503);
        }

        return $next($request);
    }
}
