<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Transaction;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    public function index(Request $request)
    {
        $operatorId = $request->user()->id;
        $eventIds = Event::where('operator_id', $operatorId)->pluck('id');

        return response()->json([
            'total_events' => Event::where('operator_id', $operatorId)->count(),
            'active_events' => Event::where('operator_id', $operatorId)->whereIn('status', ['published', 'live'])->count(),
            'total_revenue' => Transaction::whereIn('event_id', $eventIds)->where('status', 'approved')->sum('total_amount'),
            'pending_transactions' => Transaction::whereIn('event_id', $eventIds)->where('status', 'pending')->count(),
            'total_tickets_sold' => Transaction::whereIn('event_id', $eventIds)->where('status', 'approved')->withCount('tickets')->get()->sum('tickets_count'),
        ]);
    }

    public function eventReport(Request $request, $eventId)
    {
        $event = Event::where('operator_id', $request->user()->id)
            ->withCount(['transactions as approved_count' => fn($q) => $q->where('status', 'approved')])
            ->findOrFail($eventId);

        $transactions = Transaction::where('event_id', $eventId)
            ->with(['items.ticketType:id,name', 'user:id,username'])
            ->where('status', 'approved')
            ->get();

        return response()->json([
            'event' => $event,
            'total_revenue' => $transactions->sum('total_amount'),
            'total_tickets' => $transactions->flatMap->tickets->count(),
            'transactions' => $transactions,
        ]);
    }
}
