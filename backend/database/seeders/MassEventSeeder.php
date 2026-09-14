<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MassEventSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $events = \App\Models\Event::factory()->count(30)->create();

        foreach ($events as $event) {
            // Generate Banner
            \App\Models\EventBanner::create([
                'event_id' => $event->id,
                'image_url' => "https://placehold.co/1200x400/0B0B0C/FF5A1F?text=" . urlencode($event->title),
                'sort_order' => 0,
            ]);

            // Generate Ticket Types
            \App\Models\TicketType::create([
                'event_id' => $event->id,
                'name' => 'Reguler',
                'price' => rand(50000, 150000),
                'quota' => rand(100, 500),
                'is_numbered_seating' => false,
            ]);

            \App\Models\TicketType::create([
                'event_id' => $event->id,
                'name' => 'VIP',
                'price' => rand(250000, 500000),
                'quota' => rand(20, 50),
                'is_numbered_seating' => false,
            ]);
        }
    }
}
