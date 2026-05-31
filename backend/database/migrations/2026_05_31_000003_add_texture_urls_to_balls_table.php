<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('balls', function (Blueprint $table): void {
            $table->string('texture_preview_url')->nullable()->after('texture_asset_prefix');
            $table->string('texture_albedo_url')->nullable()->after('texture_preview_url');
            $table->string('texture_normal_url')->nullable()->after('texture_albedo_url');
            $table->string('texture_metallic_url')->nullable()->after('texture_normal_url');
            $table->string('texture_roughness_url')->nullable()->after('texture_metallic_url');
            $table->string('texture_ambient_occlusion_url')->nullable()->after('texture_roughness_url');
        });
    }

    public function down(): void
    {
        Schema::table('balls', function (Blueprint $table): void {
            $table->dropColumn([
                'texture_preview_url',
                'texture_albedo_url',
                'texture_normal_url',
                'texture_metallic_url',
                'texture_roughness_url',
                'texture_ambient_occlusion_url',
            ]);
        });
    }
};
