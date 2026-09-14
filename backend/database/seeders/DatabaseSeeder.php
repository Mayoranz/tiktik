<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Event;
use App\Models\EventBanner;
use App\Models\TicketType;
use App\Models\Seat;
use App\Models\PaymentMethod;
use App\Models\Setting;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Platform Settings ──
        Setting::setValue('platform_name', 'TIKTIK');
        Setting::setValue('platform_logo', '/storage/logo.png');
        Setting::setValue('whatsapp_contact', '6281234567890');
        Setting::setValue('maintenance_mode', 'false');

        // ── Categories ──
        $this->call(CategorySeeder::class);

        // ── Admin ──
        $admin = User::create([
            'username' => 'SuperAdmin',
            'nik' => '1234567890123456',
            'email' => 'admin@tiktik.com',
            'phone' => '081200000001',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'admin',
        ]);

        // ── Operators ──
        $operator1 = User::create([
            'username' => 'PromosiNusantara',
            'nik' => '2234567890123456',
            'email' => 'operator1@tiktik.com',
            'phone' => '081200000002',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'operator',
        ]);

        $operator2 = User::create([
            'username' => 'MegaEntertainment',
            'nik' => '3234567890123456',
            'email' => 'operator2@tiktik.com',
            'phone' => '081200000003',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'operator',
        ]);

        // ── Buyers ──
        for ($i = 1; $i <= 5; $i++) {
            User::create([
                'username' => "Buyer{$i}",
                'nik' => str_pad("400000000000000{$i}", 16, '0', STR_PAD_LEFT),
                'email' => "buyer{$i}@example.com",
                'phone' => "08130000000{$i}",
                'password' => \Illuminate\Support\Facades\Hash::make('password123'),
                'role' => 'buyer',
            ]);
        }

        // ── Events ──

        // Event 1: Concert (numbered seating)
        $event1 = Event::create([
            'category_id' => 1, // Konser
            'operator_id' => $operator1->id,
            'title' => 'Konser Akbar Nusantara 2026',
            'description' => 'Konser musik terbesar di Indonesia menghadirkan artis-artis ternama tanah air. Nikmati pengalaman konser tak terlupakan dengan sound system premium dan panggung spektakuler.',
            'location_name' => 'Gelora Bung Karno, Jakarta',
            'google_maps_url' => 'https://maps.google.com/?q=Gelora+Bung+Karno',
            'event_date' => now()->addDays(30),
            'ticket_sales_start' => now()->subDays(1),
            'status' => 'published',
            'is_exclusive' => true,
            'is_featured' => true,
        ]);

        EventBanner::create([
            'event_id' => $event1->id,
            'image_url' => 'https://placehold.co/1200x400/30BCED/FFFFFF?text=Konser+Akbar+Nusantara+2026',
            'sort_order' => 1,
        ]);

        $vipType = TicketType::create([
            'event_id' => $event1->id,
            'name' => 'VIP',
            'price' => 1500000,
            'quota' => 50,
            'is_numbered_seating' => true,
        ]);

        // Create VIP seats A1-A50
        for ($i = 1; $i <= 50; $i++) {
            Seat::create([
                'ticket_type_id' => $vipType->id,
                'seat_number' => 'A' . $i,
                'status' => 'available',
            ]);
        }

        $regularType = TicketType::create([
            'event_id' => $event1->id,
            'name' => 'Regular',
            'price' => 500000,
            'quota' => 200,
            'is_numbered_seating' => false,
        ]);

        $tribuneType = TicketType::create([
            'event_id' => $event1->id,
            'name' => 'Tribune',
            'price' => 250000,
            'quota' => 500,
            'is_numbered_seating' => false,
        ]);

        PaymentMethod::create([
            'event_id' => $event1->id,
            'method' => 'bank_transfer',
            'bank_name' => 'BCA',
            'account_name' => 'PT Promosi Nusantara',
            'account_number' => '1234567890',
        ]);

        PaymentMethod::create([
            'event_id' => $event1->id,
            'method' => 'bank_transfer',
            'bank_name' => 'Mandiri',
            'account_name' => 'PT Promosi Nusantara',
            'account_number' => '0987654321',
        ]);

        // Event 2: Festival (free standing)
        $event2 = Event::create([
            'category_id' => 2, // Festival
            'operator_id' => $operator1->id,
            'title' => 'Festival Musik Pantai Bali 2026',
            'description' => 'Festival musik di tepi pantai dengan pemandangan sunset yang memukau. Line up artis internasional dan lokal.',
            'location_name' => 'Kuta Beach, Bali',
            'google_maps_url' => 'https://maps.google.com/?q=Kuta+Beach+Bali',
            'event_date' => now()->addDays(45),
            'ticket_sales_start' => now()->addDays(5),
            'status' => 'published',
            'is_exclusive' => false,
            'is_featured' => true,
        ]);

        EventBanner::create([
            'event_id' => $event2->id,
            'image_url' => 'https://placehold.co/1200x400/6C63FF/FFFFFF?text=Festival+Musik+Pantai+Bali',
            'sort_order' => 1,
        ]);

        TicketType::create([
            'event_id' => $event2->id,
            'name' => 'Early Bird',
            'price' => 350000,
            'quota' => 300,
            'is_numbered_seating' => false,
        ]);

        TicketType::create([
            'event_id' => $event2->id,
            'name' => 'Presale',
            'price' => 500000,
            'quota' => 500,
            'is_numbered_seating' => false,
        ]);

        PaymentMethod::create([
            'event_id' => $event2->id,
            'method' => 'bank_transfer',
            'bank_name' => 'BCA',
            'account_name' => 'PT Promosi Nusantara',
            'account_number' => '1234567890',
        ]);

        // Event 3: Workshop (operator 2)
        $event3 = Event::create([
            'category_id' => 8, // Lainnya
            'operator_id' => $operator2->id,
            'title' => 'Workshop Fotografi Professional',
            'description' => 'Workshop fotografi intensif bersama fotografer profesional. Belajar teknik lighting, komposisi, dan post-processing.',
            'location_name' => 'Hotel Grand Mercure, Surabaya',
            'google_maps_url' => 'https://maps.google.com/?q=Grand+Mercure+Surabaya',
            'event_date' => now()->addDays(14),
            'ticket_sales_start' => now()->subDays(3),
            'status' => 'published',
            'is_exclusive' => false,
            'is_featured' => false,
        ]);

        EventBanner::create([
            'event_id' => $event3->id,
            'image_url' => 'https://placehold.co/1200x400/10B981/FFFFFF?text=Workshop+Fotografi',
            'sort_order' => 1,
        ]);

        $workshopType = TicketType::create([
            'event_id' => $event3->id,
            'name' => 'Peserta',
            'price' => 750000,
            'quota' => 30,
            'is_numbered_seating' => true,
        ]);

        for ($i = 1; $i <= 30; $i++) {
            Seat::create([
                'ticket_type_id' => $workshopType->id,
                'seat_number' => 'B' . $i,
                'status' => 'available',
            ]);
        }

        PaymentMethod::create([
            'event_id' => $event3->id,
            'method' => 'bank_transfer',
            'bank_name' => 'BRI',
            'account_name' => 'PT Mega Entertainment',
            'account_number' => '5555666677',
        ]);
    }
}
