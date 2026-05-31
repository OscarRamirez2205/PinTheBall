<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('balls', function (Blueprint $table): void {
            $table->string('texture_asset_prefix', 128)->nullable()->after('texture_slug');
        });
    }

    public function down(): void
    {
        Schema::table('balls', function (Blueprint $table): void {
            $table->dropColumn('texture_asset_prefix');
        });
    }
};
