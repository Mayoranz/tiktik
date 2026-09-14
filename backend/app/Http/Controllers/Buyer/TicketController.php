<?php

namespace App\Http\Controllers\Buyer;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    public function index(Request $request)
    {
        $tickets = Ticket::whereHas('transaction', function ($q) use ($request) {
            $q->where('user_id', $request->user()->id)->where('status', 'approved');
        })
        ->with(['ticketType:id,name,price', 'seat:id,seat_number', 'transaction.event:id,title,event_date,location_name'])
        ->latest()
        ->paginate(10);

        return response()->json($tickets);
    }

    public function show(Request $request, $id)
    {
        $ticket = Ticket::whereHas('transaction', function ($q) use ($request) {
            $q->where('user_id', $request->user()->id);
        })
        ->with(['ticketType', 'seat', 'transaction.event'])
        ->findOrFail($id);

        return response()->json(['data' => $ticket]);
    }
}
