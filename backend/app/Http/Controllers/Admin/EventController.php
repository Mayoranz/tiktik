<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $events = Event::with(['operator:id,username'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->featured, fn($q) => $q->where('is_featured', true))
            ->withCount('transactions')
            ->latest()
            ->paginate(15);

        return response()->json($events);
    }

    public function toggleFeatured($id)
    {
        $event = Event::findOrFail($id);
        $event->update(['is_featured' => !$event->is_featured]);
        ActivityLog::log('admin.event.feature', "Toggled featured: {$event->title}");
        return response()->json(['message' => 'Status featured diperbarui.', 'is_featured' => $event->is_featured]);
    }

    public function moderate(Request $request, $id)
    {
        $request->validate(['status' => 'required|in:published,cancelled']);
        $event = Event::findOrFail($id);
        $event->update(['status' => $request->status]);
        ActivityLog::log('admin.event.moderate', "Moderated event {$event->title} to {$request->status}");
        return response()->json(['message' => 'Event dimoderasi.']);
    }
}
