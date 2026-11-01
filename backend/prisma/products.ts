export const products = [
  {
    shopifyid: 1001,
    name: 'Wireless Headphones',
    price: 99.99,
    vendor: 'AudioTech',
    tags: ['electronics', 'audio'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v1', price: '99.99', inventory_quantity: 50 }]),
    inventory: 50
  },
  {
    shopifyid: 1002,
    name: 'Smart Watch',
    price: 299.99,
    vendor: 'TechWear',
    tags: ['electronics', 'wearable'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v2', price: '299.99', inventory_quantity: 30 }]),
    inventory: 30
  },
  {
    shopifyid: 1003,
    name: 'Bluetooth Speaker',
    price: 79.99,
    vendor: 'AudioTech',
    tags: ['electronics', 'audio'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v3', price: '79.99', inventory_quantity: 100 }]),
    inventory: 100
  },
  {
    shopifyid: 1004,
    name: 'Mechanical Keyboard',
    price: 129.99,
    vendor: 'KeyMaster',
    tags: ['electronics', 'computer', 'accessories'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v4', price: '129.99', inventory_quantity: 45 }]),
    inventory: 45
  },
  {
    shopifyid: 1005,
    name: 'Wireless Mouse',
    price: 49.99,
    vendor: 'TechGear',
    tags: ['electronics', 'computer', 'accessories'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v5', price: '49.99', inventory_quantity: 80 }]),
    inventory: 80
  },
  {
    shopifyid: 1006,
    name: 'USB-C Hub',
    price: 39.99,
    vendor: 'ConnectPro',
    tags: ['electronics', 'computer', 'usb'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v6', price: '39.99', inventory_quantity: 65 }]),
    inventory: 65
  },
  {
    shopifyid: 1007,
    name: '4K Monitor',
    price: 449.99,
    vendor: 'VisionTech',
    tags: ['electronics', 'computer', 'display'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v7', price: '449.99', inventory_quantity: 25 }]),
    inventory: 25
  },
  {
    shopifyid: 1008,
    name: 'Gaming Mouse',
    price: 69.99,
    vendor: 'GamePro',
    tags: ['electronics', 'gaming', 'accessories'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v8', price: '69.99', inventory_quantity: 55 }]),
    inventory: 55
  },
  {
    shopifyid: 1009,
    name: 'Gaming Headset',
    price: 89.99,
    vendor: 'GamePro',
    tags: ['electronics', 'gaming', 'audio'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v9', price: '89.99', inventory_quantity: 40 }]),
    inventory: 40
  },
  {
    shopifyid: 1010,
    name: 'Webcam Pro',
    price: 109.99,
    vendor: 'VisionTech',
    tags: ['electronics', 'computer', 'camera'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1587826080692-f439cd0b70da?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v10', price: '109.99', inventory_quantity: 35 }]),
    inventory: 35
  },
  {
    shopifyid: 1011,
    name: 'Portable SSD 1TB',
    price: 119.99,
    vendor: 'DataCore',
    tags: ['electronics', 'storage', 'computer'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v11', price: '119.99', inventory_quantity: 60 }]),
    inventory: 60
  },
  {
    shopifyid: 1012,
    name: 'USB-C Charger',
    price: 34.99,
    vendor: 'PowerTech',
    tags: ['electronics', 'charger', 'mobile'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v12', price: '34.99', inventory_quantity: 120 }]),
    inventory: 120
  },
  {
    shopifyid: 1013,
    name: 'Power Bank 20000mAh',
    price: 59.99,
    vendor: 'PowerTech',
    tags: ['electronics', 'mobile', 'battery'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1609592424970-5b0d6e8c6c1d?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v13', price: '59.99', inventory_quantity: 90 }]),
    inventory: 90
  },
  {
    shopifyid: 1014,
    name: 'Smartphone Stand',
    price: 24.99,
    vendor: 'DeskMate',
    tags: ['mobile', 'accessories', 'desk'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v14', price: '24.99', inventory_quantity: 100 }]),
    inventory: 100
  },
  {
    shopifyid: 1015,
    name: 'Wireless Charger',
    price: 44.99,
    vendor: 'PowerTech',
    tags: ['electronics', 'mobile', 'charger'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v15', price: '44.99', inventory_quantity: 75 }]),
    inventory: 75
  },
  {
    shopifyid: 1016,
    name: 'Smart LED Bulb',
    price: 19.99,
    vendor: 'HomeSmart',
    tags: ['smart-home', 'lighting', 'electronics'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1550985543-f47f26a6d4d8?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v16', price: '19.99', inventory_quantity: 150 }]),
    inventory: 150
  },
  {
    shopifyid: 1017,
    name: 'Smart LED Strip',
    price: 29.99,
    vendor: 'HomeSmart',
    tags: ['smart-home', 'lighting'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v17', price: '29.99', inventory_quantity: 85 }]),
    inventory: 85
  },
  {
    shopifyid: 1018,
    name: 'Smart Doorbell',
    price: 149.99,
    vendor: 'SecureHome',
    tags: ['smart-home', 'security', 'camera'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1558008258-3256797b43f3?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v18', price: '149.99', inventory_quantity: 30 }]),
    inventory: 30
  },
  {
    shopifyid: 1019,
    name: 'Indoor Security Camera',
    price: 89.99,
    vendor: 'SecureHome',
    tags: ['security', 'camera', 'smart-home'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v19', price: '89.99', inventory_quantity: 45 }]),
    inventory: 45
  },
  {
    shopifyid: 1020,
    name: 'Smart Thermostat',
    price: 199.99,
    vendor: 'HomeSmart',
    tags: ['smart-home', 'climate', 'electronics'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v20', price: '199.99', inventory_quantity: 20 }]),
    inventory: 20
  },
  {
    shopifyid: 1021,
    name: 'Robot Vacuum',
    price: 349.99,
    vendor: 'CleanBot',
    tags: ['home', 'smart-home', 'appliances'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v21', price: '349.99', inventory_quantity: 18 }]),
    inventory: 18
  },
  {
    shopifyid: 1022,
    name: 'Air Purifier',
    price: 179.99,
    vendor: 'AirPure',
    tags: ['home', 'appliances', 'air'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v22', price: '179.99', inventory_quantity: 28 }]),
    inventory: 28
  },
  {
    shopifyid: 1023,
    name: 'Electric Kettle',
    price: 54.99,
    vendor: 'KitchenPro',
    tags: ['kitchen', 'appliances'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1594213114663-d94db9b1712b?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v23', price: '54.99', inventory_quantity: 70 }]),
    inventory: 70
  },
  {
    shopifyid: 1024,
    name: 'Coffee Maker',
    price: 129.99,
    vendor: 'KitchenPro',
    tags: ['kitchen', 'coffee', 'appliances'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1517668808823-7d847a1f0141?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v24', price: '129.99', inventory_quantity: 35 }]),
    inventory: 35
  },
  {
    shopifyid: 1025,
    name: 'Air Fryer',
    price: 109.99,
    vendor: 'KitchenPro',
    tags: ['kitchen', 'appliances', 'cooking'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1648135604639-8f7f3f1c8a4e?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v25', price: '109.99', inventory_quantity: 42 }]),
    inventory: 42
  },
  {
    shopifyid: 1026,
    name: 'Blender Pro',
    price: 79.99,
    vendor: 'KitchenPro',
    tags: ['kitchen', 'appliances'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v26', price: '79.99', inventory_quantity: 50 }]),
    inventory: 50
  },
  {
    shopifyid: 1027,
    name: 'Nonstick Cookware Set',
    price: 159.99,
    vendor: 'HomeChef',
    tags: ['kitchen', 'cookware', 'home'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v27', price: '159.99', inventory_quantity: 25 }]),
    inventory: 25
  },
  {
    shopifyid: 1028,
    name: 'Stainless Steel Pan',
    price: 64.99,
    vendor: 'HomeChef',
    tags: ['kitchen', 'cookware'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1584990347449-ae7b5d0c8d2f?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v28', price: '64.99', inventory_quantity: 60 }]),
    inventory: 60
  },
  {
    shopifyid: 1029,
    name: 'Chef Knife',
    price: 74.99,
    vendor: 'KitchenMaster',
    tags: ['kitchen', 'cooking', 'tools'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1566454419290-57a64afe30ac?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v29', price: '74.99', inventory_quantity: 45 }]),
    inventory: 45
  },
  {
    shopifyid: 1030,
    name: 'Digital Kitchen Scale',
    price: 29.99,
    vendor: 'KitchenMaster',
    tags: ['kitchen', 'tools'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v30', price: '29.99', inventory_quantity: 80 }]),
    inventory: 80
  },
  {
    shopifyid: 1031,
    name: 'Cotton T-Shirt',
    price: 24.99,
    vendor: 'UrbanWear',
    tags: ['clothing', 'fashion', 'men'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v31', price: '24.99', inventory_quantity: 100 }]),
    inventory: 100
  },
  {
    shopifyid: 1032,
    name: 'Slim Fit Jeans',
    price: 59.99,
    vendor: 'UrbanWear',
    tags: ['clothing', 'fashion', 'jeans'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v32', price: '59.99', inventory_quantity: 65 }]),
    inventory: 65
  },
  {
    shopifyid: 1033,
    name: 'Hooded Sweatshirt',
    price: 69.99,
    vendor: 'StreetStyle',
    tags: ['clothing', 'fashion', 'hoodie'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v33', price: '69.99', inventory_quantity: 55 }]),
    inventory: 55
  },
  {
    shopifyid: 1034,
    name: 'Denim Jacket',
    price: 99.99,
    vendor: 'StreetStyle',
    tags: ['clothing', 'fashion', 'jacket'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v34', price: '99.99', inventory_quantity: 35 }]),
    inventory: 35
  },
  {
    shopifyid: 1035,
    name: 'Running Shoes',
    price: 119.99,
    vendor: 'SportFlex',
    tags: ['shoes', 'sports', 'running'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v35', price: '119.99', inventory_quantity: 48 }]),
    inventory: 48
  },
  {
    shopifyid: 1036,
    name: 'Casual Sneakers',
    price: 89.99,
    vendor: 'UrbanStep',
    tags: ['shoes', 'fashion', 'casual'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v36', price: '89.99', inventory_quantity: 60 }]),
    inventory: 60
  },
  {
    shopifyid: 1037,
    name: 'Leather Boots',
    price: 149.99,
    vendor: 'UrbanStep',
    tags: ['shoes', 'fashion', 'boots'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1542840410-3092f99611a3?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v37', price: '149.99', inventory_quantity: 30 }]),
    inventory: 30
  },
  {
    shopifyid: 1038,
    name: 'Baseball Cap',
    price: 22.99,
    vendor: 'SportFlex',
    tags: ['fashion', 'sports', 'accessories'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v38', price: '22.99', inventory_quantity: 90 }]),
    inventory: 90
  },
  {
    shopifyid: 1039,
    name: 'Leather Wallet',
    price: 39.99,
    vendor: 'LeatherCraft',
    tags: ['fashion', 'accessories', 'wallet'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v39', price: '39.99', inventory_quantity: 75 }]),
    inventory: 75
  },
  {
    shopifyid: 1040,
    name: 'Leather Belt',
    price: 44.99,
    vendor: 'LeatherCraft',
    tags: ['fashion', 'accessories', 'belt'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v40', price: '44.99', inventory_quantity: 70 }]),
    inventory: 70
  },
  {
    shopifyid: 1041,
    name: 'Travel Backpack',
    price: 79.99,
    vendor: 'TravelGear',
    tags: ['travel', 'bags', 'accessories'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v41', price: '79.99', inventory_quantity: 45 }]),
    inventory: 45
  },
  {
    shopifyid: 1042,
    name: 'Laptop Backpack',
    price: 69.99,
    vendor: 'TravelGear',
    tags: ['bags', 'computer', 'travel'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1556306535-38febf6782e7?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v42', price: '69.99', inventory_quantity: 55 }]),
    inventory: 55
  },
  {
    shopifyid: 1043,
    name: 'Hard Shell Suitcase',
    price: 139.99,
    vendor: 'TravelGear',
    tags: ['travel', 'luggage'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1565026057447-bc90a39d99b9?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v43', price: '139.99', inventory_quantity: 25 }]),
    inventory: 25
  },
  {
    shopifyid: 1044,
    name: 'Travel Neck Pillow',
    price: 29.99,
    vendor: 'TravelComfort',
    tags: ['travel', 'accessories'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v44', price: '29.99', inventory_quantity: 85 }]),
    inventory: 85
  },
  {
    shopifyid: 1045,
    name: 'Stainless Water Bottle',
    price: 34.99,
    vendor: 'HydroMax',
    tags: ['sports', 'fitness', 'drinkware'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v45', price: '34.99', inventory_quantity: 100 }]),
    inventory: 100
  },
  {
    shopifyid: 1046,
    name: 'Yoga Mat',
    price: 39.99,
    vendor: 'FitLife',
    tags: ['fitness', 'yoga', 'sports'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1592432678016-e910b452f9a2?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v46', price: '39.99', inventory_quantity: 70 }]),
    inventory: 70
  },
  {
    shopifyid: 1047,
    name: 'Adjustable Dumbbells',
    price: 199.99,
    vendor: 'FitLife',
    tags: ['fitness', 'gym', 'weights'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v47', price: '199.99', inventory_quantity: 20 }]),
    inventory: 20
  },
  {
    shopifyid: 1048,
    name: 'Resistance Bands',
    price: 24.99,
    vendor: 'FitLife',
    tags: ['fitness', 'gym', 'training'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v48', price: '24.99', inventory_quantity: 120 }]),
    inventory: 120
  },
  {
    shopifyid: 1049,
    name: 'Smart Fitness Tracker',
    price: 79.99,
    vendor: 'FitTech',
    tags: ['fitness', 'wearable', 'electronics'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1557935728-e6d1eaabe558?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v49', price: '79.99', inventory_quantity: 50 }]),
    inventory: 50
  },
  {
    shopifyid: 1050,
    name: 'Electric Massage Gun',
    price: 119.99,
    vendor: 'FitTech',
    tags: ['fitness', 'recovery', 'electronics'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v50', price: '119.99', inventory_quantity: 35 }]),
    inventory: 35
  },
  {
    shopifyid: 1051,
    name: 'Office Desk',
    price: 249.99,
    vendor: 'OfficePro',
    tags: ['office', 'furniture', 'desk'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v51', price: '249.99', inventory_quantity: 15 }]),
    inventory: 15
  },
  {
    shopifyid: 1052,
    name: 'Ergonomic Office Chair',
    price: 299.99,
    vendor: 'OfficePro',
    tags: ['office', 'furniture', 'chair'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v52', price: '299.99', inventory_quantity: 20 }]),
    inventory: 20
  },
  {
    shopifyid: 1053,
    name: 'LED Desk Lamp',
    price: 49.99,
    vendor: 'OfficePro',
    tags: ['office', 'lighting', 'desk'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v53', price: '49.99', inventory_quantity: 65 }]),
    inventory: 65
  },
  {
    shopifyid: 1054,
    name: 'Monitor Arm',
    price: 89.99,
    vendor: 'DeskMate',
    tags: ['office', 'computer', 'accessories'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v54', price: '89.99', inventory_quantity: 40 }]),
    inventory: 40
  },
  {
    shopifyid: 1055,
    name: 'Mechanical Pencil Set',
    price: 14.99,
    vendor: 'WritePro',
    tags: ['office', 'stationery'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v55', price: '14.99', inventory_quantity: 150 }]),
    inventory: 150
  },
  {
    shopifyid: 1056,
    name: 'Premium Notebook',
    price: 19.99,
    vendor: 'WritePro',
    tags: ['office', 'stationery', 'notebook'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v56', price: '19.99', inventory_quantity: 100 }]),
    inventory: 100
  },
  {
    shopifyid: 1057,
    name: 'Desk Organizer',
    price: 27.99,
    vendor: 'DeskMate',
    tags: ['office', 'organization', 'desk'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v57', price: '27.99', inventory_quantity: 75 }]),
    inventory: 75
  },
  {
    shopifyid: 1058,
    name: 'External DVD Drive',
    price: 44.99,
    vendor: 'DataCore',
    tags: ['computer', 'storage', 'electronics'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v58', price: '44.99', inventory_quantity: 30 }]),
    inventory: 30
  },
  {
    shopifyid: 1059,
    name: 'WiFi 6 Router',
    price: 159.99,
    vendor: 'NetCore',
    tags: ['networking', 'electronics', 'wifi'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1648135604639-8f7f3f1c8a4e?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v59', price: '159.99', inventory_quantity: 25 }]),
    inventory: 25
  },
  {
    shopifyid: 1060,
    name: 'Network Switch',
    price: 89.99,
    vendor: 'NetCore',
    tags: ['networking', 'electronics'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v60', price: '89.99', inventory_quantity: 40 }]),
    inventory: 40
  },
  {
    shopifyid: 1061,
    name: 'Smart TV 55 Inch',
    price: 599.99,
    vendor: 'VisionTech',
    tags: ['electronics', 'tv', 'entertainment'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v61', price: '599.99', inventory_quantity: 12 }]),
    inventory: 12
  },
  {
    shopifyid: 1062,
    name: 'Streaming Stick',
    price: 49.99,
    vendor: 'StreamBox',
    tags: ['electronics', 'tv', 'streaming'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v62', price: '49.99', inventory_quantity: 60 }]),
    inventory: 60
  },
  {
    shopifyid: 1063,
    name: 'Soundbar',
    price: 229.99,
    vendor: 'AudioTech',
    tags: ['audio', 'tv', 'electronics'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v63', price: '229.99', inventory_quantity: 22 }]),
    inventory: 22
  },
  {
    shopifyid: 1064,
    name: 'Home Theater System',
    price: 499.99,
    vendor: 'AudioTech',
    tags: ['audio', 'home-theater', 'electronics'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v64', price: '499.99', inventory_quantity: 10 }]),
    inventory: 10
  },
  {
    shopifyid: 1065,
    name: 'Digital Camera',
    price: 749.99,
    vendor: 'PhotoPro',
    tags: ['camera', 'photography', 'electronics'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v65', price: '749.99', inventory_quantity: 14 }]),
    inventory: 14
  },
  {
    shopifyid: 1066,
    name: 'Camera Tripod',
    price: 69.99,
    vendor: 'PhotoPro',
    tags: ['camera', 'photography', 'accessories'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1606986628253-8c0e4f7b7a26?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v66', price: '69.99', inventory_quantity: 45 }]),
    inventory: 45
  },
  {
    shopifyid: 1067,
    name: 'Camera Backpack',
    price: 99.99,
    vendor: 'PhotoPro',
    tags: ['camera', 'photography', 'bags'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1556306535-38febf6782e7?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v67', price: '99.99', inventory_quantity: 30 }]),
    inventory: 30
  },
  {
    shopifyid: 1068,
    name: 'LED Video Light',
    price: 89.99,
    vendor: 'StudioGear',
    tags: ['photography', 'lighting', 'video'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v68', price: '89.99', inventory_quantity: 35 }]),
    inventory: 35
  },
  {
    shopifyid: 1069,
    name: 'USB Microphone',
    price: 99.99,
    vendor: 'AudioTech',
    tags: ['audio', 'microphone', 'computer'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v69', price: '99.99', inventory_quantity: 40 }]),
    inventory: 40
  },
  {
    shopifyid: 1070,
    name: 'Podcast Microphone Kit',
    price: 179.99,
    vendor: 'StudioGear',
    tags: ['audio', 'podcast', 'microphone'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v70', price: '179.99', inventory_quantity: 18 }]),
    inventory: 18
  },
  {
    shopifyid: 1071,
    name: 'Bluetooth Earbuds',
    price: 59.99,
    vendor: 'AudioTech',
    tags: ['audio', 'electronics', 'wearable'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v71', price: '59.99', inventory_quantity: 95 }]),
    inventory: 95
  },
  {
    shopifyid: 1072,
    name: 'Noise Cancelling Earbuds',
    price: 149.99,
    vendor: 'AudioTech',
    tags: ['audio', 'electronics', 'noise-cancelling'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v72', price: '149.99', inventory_quantity: 45 }]),
    inventory: 45
  },
  {
    shopifyid: 1073,
    name: 'Smart Speaker',
    price: 99.99,
    vendor: 'HomeSmart',
    tags: ['smart-home', 'audio', 'electronics'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v73', price: '99.99', inventory_quantity: 55 }]),
    inventory: 55
  },
  {
    shopifyid: 1074,
    name: 'Digital Alarm Clock',
    price: 34.99,
    vendor: 'HomeSmart',
    tags: ['home', 'electronics', 'clock'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v74', price: '34.99', inventory_quantity: 80 }]),
    inventory: 80
  },
  {
    shopifyid: 1075,
    name: 'Electric Toothbrush',
    price: 69.99,
    vendor: 'CleanCare',
    tags: ['personal-care', 'electronics', 'bathroom'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1559591937-e6b5e5d7e4d6?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v75', price: '69.99', inventory_quantity: 50 }]),
    inventory: 50
  },
  {
    shopifyid: 1076,
    name: 'Hair Dryer',
    price: 79.99,
    vendor: 'StyleTech',
    tags: ['beauty', 'personal-care', 'electronics'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v76', price: '79.99', inventory_quantity: 45 }]),
    inventory: 45
  },
  {
    shopifyid: 1077,
    name: 'Hair Straightener',
    price: 89.99,
    vendor: 'StyleTech',
    tags: ['beauty', 'personal-care'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v77', price: '89.99', inventory_quantity: 40 }]),
    inventory: 40
  },
  {
    shopifyid: 1078,
    name: 'Electric Shaver',
    price: 99.99,
    vendor: 'CleanCare',
    tags: ['personal-care', 'grooming', 'electronics'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v78', price: '99.99', inventory_quantity: 35 }]),
    inventory: 35
  },
  {
    shopifyid: 1079,
    name: 'Beard Trimmer',
    price: 54.99,
    vendor: 'CleanCare',
    tags: ['grooming', 'personal-care'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1621607512022-6aecc4fed814?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v79', price: '54.99', inventory_quantity: 60 }]),
    inventory: 60
  },
  {
    shopifyid: 1080,
    name: 'Electric Lunch Box',
    price: 49.99,
    vendor: 'KitchenGo',
    tags: ['kitchen', 'portable', 'appliances'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v80', price: '49.99', inventory_quantity: 55 }]),
    inventory: 55
  },
  {
    shopifyid: 1081,
    name: 'Portable Projector',
    price: 299.99,
    vendor: 'VisionTech',
    tags: ['electronics', 'projector', 'entertainment'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v81', price: '299.99', inventory_quantity: 18 }]),
    inventory: 18
  },
  {
    shopifyid: 1082,
    name: 'Mini Bluetooth Projector',
    price: 179.99,
    vendor: 'VisionTech',
    tags: ['electronics', 'projector', 'portable'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v82', price: '179.99', inventory_quantity: 25 }]),
    inventory: 25
  },
  {
    shopifyid: 1083,
    name: 'Gaming Controller',
    price: 69.99,
    vendor: 'GamePro',
    tags: ['gaming', 'electronics', 'controller'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v83', price: '69.99', inventory_quantity: 70 }]),
    inventory: 70
  },
  {
    shopifyid: 1084,
    name: 'Gaming Keyboard',
    price: 99.99,
    vendor: 'GamePro',
    tags: ['gaming', 'computer', 'keyboard'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v84', price: '99.99', inventory_quantity: 50 }]),
    inventory: 50
  },
  {
    shopifyid: 1085,
    name: 'Gaming Monitor 27 Inch',
    price: 329.99,
    vendor: 'GamePro',
    tags: ['gaming', 'monitor', 'computer'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v85', price: '329.99', inventory_quantity: 20 }]),
    inventory: 20
  },
  {
    shopifyid: 1086,
    name: 'Gaming Chair',
    price: 249.99,
    vendor: 'GamePro',
    tags: ['gaming', 'furniture', 'chair'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v86', price: '249.99', inventory_quantity: 16 }]),
    inventory: 16
  },
  {
    shopifyid: 1087,
    name: 'Desk Mat',
    price: 29.99,
    vendor: 'DeskMate',
    tags: ['desk', 'gaming', 'accessories'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v87', price: '29.99', inventory_quantity: 90 }]),
    inventory: 90
  },
  {
    shopifyid: 1088,
    name: 'LED Gaming Lights',
    price: 39.99,
    vendor: 'GamePro',
    tags: ['gaming', 'lighting', 'electronics'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v88', price: '39.99', inventory_quantity: 65 }]),
    inventory: 65
  },
  {
    shopifyid: 1089,
    name: 'VR Headset',
    price: 399.99,
    vendor: 'VirtualTech',
    tags: ['gaming', 'vr', 'electronics'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v89', price: '399.99', inventory_quantity: 15 }]),
    inventory: 15
  },
  {
    shopifyid: 1090,
    name: 'VR Motion Controllers',
    price: 149.99,
    vendor: 'VirtualTech',
    tags: ['gaming', 'vr', 'accessories'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v90', price: '149.99', inventory_quantity: 22 }]),
    inventory: 22
  },
  {
    shopifyid: 1091,
    name: 'Smart Scale',
    price: 49.99,
    vendor: 'FitTech',
    tags: ['fitness', 'smart-home', 'electronics'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v91', price: '49.99', inventory_quantity: 50 }]),
    inventory: 50
  },
  {
    shopifyid: 1092,
    name: 'Foam Roller',
    price: 29.99,
    vendor: 'FitLife',
    tags: ['fitness', 'recovery', 'sports'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1597452485677-d661b2c1e3c3?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v92', price: '29.99', inventory_quantity: 80 }]),
    inventory: 80
  },
  {
    shopifyid: 1093,
    name: 'Exercise Mat',
    price: 34.99,
    vendor: 'FitLife',
    tags: ['fitness', 'exercise', 'sports'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1592432678016-e910b452f9a2?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v93', price: '34.99', inventory_quantity: 75 }]),
    inventory: 75
  },
  {
    shopifyid: 1094,
    name: 'Jump Rope',
    price: 14.99,
    vendor: 'FitLife',
    tags: ['fitness', 'sports', 'training'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v94', price: '14.99', inventory_quantity: 120 }]),
    inventory: 120
  },
  {
    shopifyid: 1095,
    name: 'Camping Lantern',
    price: 44.99,
    vendor: 'OutdoorPro',
    tags: ['outdoor', 'camping', 'lighting'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1520213763983-2210666a8c7b?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v95', price: '44.99', inventory_quantity: 60 }]),
    inventory: 60
  },
  {
    shopifyid: 1096,
    name: 'Portable Camping Stove',
    price: 69.99,
    vendor: 'OutdoorPro',
    tags: ['outdoor', 'camping', 'cooking'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v96', price: '69.99', inventory_quantity: 35 }]),
    inventory: 35
  },
  {
    shopifyid: 1097,
    name: 'Camping Chair',
    price: 49.99,
    vendor: 'OutdoorPro',
    tags: ['outdoor', 'camping', 'furniture'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v97', price: '49.99', inventory_quantity: 45 }]),
    inventory: 45
  },
  {
    shopifyid: 1098,
    name: 'Hiking Backpack',
    price: 109.99,
    vendor: 'OutdoorPro',
    tags: ['outdoor', 'hiking', 'bags'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v98', price: '109.99', inventory_quantity: 30 }]),
    inventory: 30
  },
  {
    shopifyid: 1099,
    name: 'Portable Solar Charger',
    price: 89.99,
    vendor: 'PowerTech',
    tags: ['solar', 'outdoor', 'electronics'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v99', price: '89.99', inventory_quantity: 40 }]),
    inventory: 40
  },
  {
    shopifyid: 1100,
    name: 'Bluetooth Car Adapter',
    price: 29.99,
    vendor: 'AutoTech',
    tags: ['automotive', 'electronics', 'bluetooth'],
    images: JSON.stringify(['https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80']),
    variants: JSON.stringify([{ id: 'v100', price: '29.99', inventory_quantity: 90 }]),
    inventory: 90
  }
];