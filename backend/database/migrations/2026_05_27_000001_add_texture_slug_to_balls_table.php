<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('balls', function (Blueprint $table) {
            $table->string('texture_slug', 64)->nullable()->after('name');
        });
    }

    public function down(): void {
        Schema::table('balls', function (Blueprint $table) {
            $table->dropColumn('texture_slug');
        });
    }
};
