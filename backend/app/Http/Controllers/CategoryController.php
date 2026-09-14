<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\Category::orderBy('id')->get());
    }
}
