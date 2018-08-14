<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddPanoramaDataType extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        DB::unprepared("INSERT INTO `data_types` (`id`, `name`, `slug`, `display_name_singular`, `display_name_plural`, `icon`, `model_name`, `policy_name`, `controller`, `description`, `generate_permissions`, `server_side`, `details`, `created_at`, `updated_at`) VALUES
(4, 'panoramas', 'panoramas', 'Panorama', 'Panoramas', 'voyager-photos', 'App\\\Data\\\Panorama', NULL, NULL, NULL, 1, 1, '{\"order_column\":\"created_at\",\"order_display_column\":\"title\"}', '2018-05-14 18:09:40', '2018-05-14 18:20:14');
");
        DB::unprepared("
INSERT INTO `data_rows` (`id`, `data_type_id`, `field`, `type`, `display_name`, `required`, `browse`, `read`, `edit`, `add`, `delete`, `details`, `order`) VALUES
(23, 4, 'id', 'hidden', 'Id', 1, 0, 0, 0, 0, 0, NULL, 1),
(24, 4, 'title', 'text', 'Title', 1, 1, 1, 1, 0, 1, NULL, 2),
(25, 4, 'manage_key', 'text', 'Manage Key', 0, 0, 1, 1, 0, 1, NULL, 3),
(26, 4, 'private_key', 'text', 'Private Key', 0, 0, 1, 1, 0, 1, NULL, 4),
(27, 4, 'public', 'checkbox', 'Availabale in catalog', 1, 1, 1, 1, 0, 1, '{\"on\":\"Yes\",\"off\":\"No\",\"checked\":\"true\"}', 5),
(28, 4, 'type', 'select_dropdown', 'Type', 1, 1, 1, 1, 0, 1, '{\"default\":\"0\",\"options\":{\"0\":\"Cardboard photo\",\"1\":\"Over/under image\"}}', 6),
(29, 4, 'created_at', 'timestamp', 'Created At', 0, 1, 1, 1, 0, 1, NULL, 7),
(30, 4, 'updated_at', 'timestamp', 'Updated At', 0, 0, 0, 0, 0, 0, NULL, 8);");

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
