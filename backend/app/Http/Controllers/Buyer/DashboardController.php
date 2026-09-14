<?php

namespace App\Http\Controllers\Buyer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $activeTickets = $user->transactions()
            ->where('status', 'approved')
            ->with(['event:id,title,event_date,location_name', 'tickets'])
            ->latest()
            ->limit(5)
            ->get();

        $stats = [
            'total_transactions' => $user->transactions()->count(),
            'active_tickets' => $user->transactions()->where('status', 'approved')
                ->withCount('tickets')->get()->sum('tickets_count'),
            'pending_payments' => $user->transactions()->where('status', 'pending')->count(),
        ];

        return response()->json([
            'stats' => $stats,
            'recent_tickets' => $activeTickets,
        ]);
    }
}
