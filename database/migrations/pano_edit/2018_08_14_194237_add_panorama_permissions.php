<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddPanoramaPermissions extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        DB::unprepared("INSERT INTO `permissions` (`id`, `key`, `table_name`, `created_at`, `updated_at`) VALUES
(31, 'delete_panoramas', 'panoramas', '2018-05-14 18:09:40', '2018-05-14 18:09:40'),
(30, 'add_panoramas', 'panoramas', '2018-05-14 18:09:40', '2018-05-14 18:09:40'),
(29, 'edit_panoramas', 'panoramas', '2018-05-14 18:09:40', '2018-05-14 18:09:40'),
(28, 'read_panoramas', 'panoramas', '2018-05-14 18:09:40', '2018-05-14 18:09:40'),
(27, 'browse_panoramas', 'panoramas', '2018-05-14 18:09:40', '2018-05-14 18:09:40');");

        DB::unprepared("INSERT INTO `permission_role` (`permission_id`, `role_id`) VALUES
(27, 1),
(28, 1),
(29, 1),
(31, 1);");
    
    }

    

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        //
    }
}
