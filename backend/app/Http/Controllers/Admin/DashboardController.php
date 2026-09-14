<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Event;
use App\Models\Transaction;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        return response()->json([
            'total_operators' => User::where('role', 'operator')->count(),
            'total_buyers' => User::where('role', 'buyer')->count(),
            'total_events' => Event::count(),
            'total_tickets_sold' => Transaction::where('status', 'approved')->withCount('tickets')->get()->sum('tickets_count'),
            'total_revenue' => Transaction::where('status', 'approved')->sum('total_amount'),
            'recent_logs' => ActivityLog::with('user:id,username')->latest('created_at')->limit(20)->get(),
        ]);
    }

    public function activityLogs(Request $request)
    {
        $logs = ActivityLog::with('user:id,username,role')
            ->latest('created_at')
            ->paginate(20);

        return response()->json($logs);
    }
}
