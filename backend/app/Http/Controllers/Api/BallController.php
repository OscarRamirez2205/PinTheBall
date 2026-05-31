<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ball;
use Illuminate\Http\Request;

class BallController extends Controller
{
    public function index()
    {
        return response()->json(Ball::orderBy('id')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'subname' => 'nullable|string|max:255',
            'texture_slug' => 'nullable|string|max:64',
            'price' => 'nullable|integer|min:0',
            'deal_price' => 'nullable|integer|min:0',
        ]);

        $ball = Ball::create($data);

        return response()->json($ball, 201);
    }

    public function show(Ball $ball)
    {
        return response()->json($ball);
    }

    public function update(Request $request, Ball $ball)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'subname' => 'nullable|string|max:255',
            'texture_slug' => 'sometimes|nullable|string|max:64',
            'price' => 'sometimes|nullable|integer|min:0',
            'deal_price' => 'sometimes|nullable|integer|min:0',
        ]);

        $ball->fill($data);
        $ball->save();

        return response()->json($ball);
    }

    public function destroy(Ball $ball)
    {
        $ball->delete();

        return response()->json(null, 204);
    }
}
