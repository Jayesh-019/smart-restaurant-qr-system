INSERT INTO restaurant_tables (table_number, qr_token, seats, is_active)
VALUES
    ('T1', 'table-token-t1', 4, TRUE),
    ('T2', 'table-token-t2', 4, TRUE),
    ('T3', 'table-token-t3', 6, TRUE),
    ('T4', 'table-token-t4', 2, TRUE),
    ('T5', 'table-token-t5', 4, TRUE);

INSERT INTO menu_items (name, description, category, price, image_url, is_available)
VALUES
    ('Tomato Soup', 'Creamy tomato soup with herbs', 'starter', 120.00, NULL, TRUE),
    ('Garlic Bread', 'Toasted bread with garlic butter', 'starter', 90.00, NULL, TRUE),
    ('Paneer Butter Masala', 'Cottage cheese in rich tomato gravy', 'main_course', 260.00, NULL, TRUE),
    ('Veg Biryani', 'Fragrant basmati rice with vegetables', 'main_course', 220.00, NULL, TRUE),
    ('Margherita Pizza', 'Classic cheese pizza', 'main_course', 320.00, NULL, TRUE),
    ('Fresh Lime Soda', 'Refreshing sweet and salted soda', 'beverage', 80.00, NULL, TRUE),
    ('Cold Coffee', 'Chilled coffee with milk', 'beverage', 110.00, NULL, TRUE),
    ('Brownie with Ice Cream', 'Warm brownie served with vanilla ice cream', 'dessert', 150.00, NULL, TRUE);
