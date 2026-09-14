<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Setting;
use Illuminate\Http\Request;

class PublicController extends Controller
{
    /**
     * List published events with search and filter.
     */
    public function events(Request $request)
    {
        $query = Event::with(['banners', 'ticketTypes', 'operator:id,username'])
            ->published()
            ->orderBy('event_date', 'asc');

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('location_name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by date
        if ($request->filled('date_from')) {
            $query->where('event_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('event_date', '<=', $request->date_to);
        }
        
        // Filter by category
        if ($request->filled('category')) {
            $query->whereHas('category', function($q) use ($request) {
                $q->where('name', $request->category)
                  ->orWhere('slug', $request->category);
            });
        }

        $events = $query->paginate($request->get('per_page', 12));

        return response()->json($events);
    }

    /**
     * Get featured events for banner.
     */
    public function featured()
    {
        $events = Event::with(['banners'])
            ->published()
            ->featured()
            ->orderBy('event_date', 'asc')
            ->limit(10)
            ->get();

        return response()->json(['data' => $events]);
    }

    /**
     * Show event detail.
     */
    public function show($id)
    {
        $event = Event::with([
            'banners',
            'ticketTypes.seats',
            'paymentMethods',
            'operator:id,username',
        ])->findOrFail($id);

        // Add available quota to each ticket type
        $event->ticketTypes->each(function ($ticketType) {
            $ticketType->available_quota = $ticketType->availableQuota;
        });

        return response()->json(['data' => $event]);
    }

    /**
     * Get public platform settings.
     */
    public function settings()
    {
        return response()->json([
            'platform_name' => Setting::getValue('platform_name', 'TIKTIK'),
            'platform_logo' => Setting::getValue('platform_logo', ''),
            'whatsapp_contact' => Setting::getValue('whatsapp_contact', ''),
            'maintenance_mode' => Setting::getValue('maintenance_mode', 'false'),
        ]);
    }
}
