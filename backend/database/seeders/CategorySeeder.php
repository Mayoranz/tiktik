<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            'Konser', 'Festival', 'Pameran', 'Pesta', 
            'Film', 'Kuliner', 'Olahraga', 'Lainnya'
        ];

        foreach ($categories as $cat) {
            \App\Models\Category::firstOrCreate([
                'slug' => \Illuminate\Support\Str::slug($cat)
            ], [
                'name' => $cat
            ]);
        }
    }
}
