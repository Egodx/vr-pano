## Installation

``git clone``
``composer install``
Rename *.env.example* to *.env*
``php artisan key:generate``
Edit your *.env* to reflect your DB and server settings
Install Voyager admin panel
``php artisan voyager:install``
``php artisan migrate --path="/database/migrations/pano_edit"``
Create a new admin 
``php artisan voyager:admin your@email.com --create``
Make sure that **public/uploads** and **public/uploads/source** is writable
Visit **http://your-domain.tld/admin** to upload new logo and change site settings

## Testing
Change DB_TEST_DATABASE in your .env
DB_TEST_DATABASE and DB_DATABASE **must** be different databases
``php artisan migrate --database="mysql_test"``
Run ``phpunit``

