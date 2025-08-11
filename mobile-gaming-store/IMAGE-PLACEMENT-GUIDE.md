# 📸 Where to Put Your Product Images

## 🎯 **Exact Location for Images**

Your images should go in: `mobile-gaming-store/assets/images/products-organized/`

## 📁 **Folder Structure**

```
mobile-gaming-store/
└── assets/
    └── images/
        └── products-organized/
            ├── 1-gaming-controller/
            │   ├── 1-main.jpg ← PUT YOUR IMAGES HERE
            │   ├── 2-angle.jpg
            │   ├── 3-detail.jpg
            │   ├── 4-context.jpg
            │   └── 5-package.jpg
            ├── 2-sy830-gaming-headset/
            │   ├── 1-main.jpg ← PUT YOUR IMAGES HERE
            │   ├── 2-angle.jpg
            │   ├── 3-detail.jpg
            │   ├── 4-context.jpg
            │   └── 5-package.jpg
            └── ... (42 total product folders)
```

## ✅ **What the JSON Expects**

Your `products.json` is already updated to look for images at these exact paths:

**Example for Product #1 (Gaming Controller):**
```json
"image": "assets/images/products-organized/1-gaming-controller/1-main.jpg",
"images": [
  "assets/images/products-organized/1-gaming-controller/1-main.jpg",
  "assets/images/products-organized/1-gaming-controller/2-angle.jpg",
  "assets/images/products-organized/1-gaming-controller/3-detail.jpg",
  "assets/images/products-organized/1-gaming-controller/4-context.jpg",
  "assets/images/products-organized/1-gaming-controller/5-package.jpg"
]
```

## 🎯 **Step-by-Step Instructions**

### 1. Navigate to the Folder
Open: `mobile-gaming-store/assets/images/products-organized/1-gaming-controller/`

### 2. Replace Placeholder Files
You'll see files like:
- `1-main.jpg.placeholder` ← DELETE THIS
- `2-angle.jpg.placeholder` ← DELETE THIS
- etc.

### 3. Add Your Real Images
Add your actual images with these EXACT names:
- `1-main.jpg` (your best product photo)
- `2-angle.jpg` (side view or different angle) 
- `3-detail.jpg` (close-up of features)
- `4-context.jpg` (product being used)
- `5-package.jpg` (packaging or extra view)

### 4. Repeat for All Products
Do the same for all 42 product folders.

## 📋 **Complete Product Folder List**

| Product ID | Folder Name | Product Name |
|------------|-------------|--------------|
| 1 | `1-gaming-controller` | Gaming Controller |
| 2 | `2-sy830-gaming-headset` | SY830 Gaming Headset |
| 3 | `3-mobile-cooling-fan-dual` | Mobile Cooling Fan Dual |
| 4 | `4-sl17-magnetic-semiconductor-cooler` | SL17 Magnetic Semiconductor Cooler |
| 5 | `5-logitech-g933s-lightsync-wireless-gaming-headset` | Logitech G933s Lightsync Wireless Gaming Headset |
| 6 | `6-universal-360-degree-abs-gaming-accessories` | Universal 360 Degree ABS Gaming Accessories |
| 7 | `7-anti-sweat-finger-sleeve` | Anti Sweat Finger Sleeve |
| 8 | `8-k21-gaming-handle-and-trigger` | K21 Gaming Handle and Trigger |
| 10 | `10-gaming-trigger-controller` | Gaming Trigger Controller |
| 11 | `11-twolf-one-handed-keyboard` | Twolf One Handed Keyboard |
| 12 | `12-s03-semiconductor` | S03 Semiconductor |
| 13 | `13-portable-round-joystick` | Portable Round Joystick |
| 14 | `14-d19-triggers` | D19 Triggers |
| 15 | `15-finger-sleeve` | Finger Sleeve |
| 16 | `16-rgb-joystick-trigger` | RGB Joystick Trigger |
| 17 | `17-desktop-arm-controller-holder` | Desktop Arm Controller Holder |
| 18 | `18-analogue-rubber-joystick` | Analogue Rubber Joystick |
| 19 | `19-semiconductor-magnetic-cooler` | Semiconductor Magnetic Cooler |
| 20 | `20-fso1-dual-fan-plug-in` | FSO1 Dual Fan Plug In |
| 21 | `21-4-in-1-half-canded-combo` | 4 in 1 Half Canded Combo |
| 22 | `22-elo-vagabond-mobile-controller` | Elo Vagabond Mobile Controller |
| 23 | `23-razer-mouse-pad` | Razer Mouse Pad |
| 24 | `24-acedays-phone-controller` | Acedays Phone Controller |
| 25 | `25-oivo-ps5-phone-mount` | OIVO PS5 Phone Mount |
| 26 | `26-casque-deep-base-sterio-headset` | Casque Deep Base Sterio Headset |
| 27 | `27-executive-venom-controller---phone-holder` | Executive Venom Controller - Phone Holder |
| 28 | `28-jako-underdesk-holder` | JAKO Underdesk Holder |
| 29 | `29-red-magic-10-pro-smartphone-5g-16512` | Red Magic 10 Pro Smartphone 5G 16/512 |
| 30 | `30-vakilli-gaming-joystick` | Vakilli Gaming Joystick |
| 36 | `36-paladon-xbox-icon-lights` | Paladon Xbox Icon Lights |
| 39 | `39-sundisk-128gb-gameplay-190ms` | Sundisk 128GB Gameplay 190ms |
| 40 | `40-avengers-executive-phone-holder` | Avengers Executive Phone Holder |
| 41 | `41-asus-rt-ax82u-dual-band-wifi-6-gaming-router` | ASUS RT-AX82U Dual Band WiFi 6 Gaming Router |
| 45 | `45-paladon-33cm-playstation-glitter-glow` | Paladon 33cm PlayStation Glitter Glow |
| 49 | `49-playstation-5-alarm-clock` | PlayStation 5 Alarm Clock |
| 50 | `50-paladone-playstation-logo-light-up` | Paladone PlayStation Logo Light Up |
| 51 | `51-paladone-xbox-logo-light-up` | Paladone Xbox Logo Light Up |
| 52 | `52-mobile-gaming-trigger-joystick-gamepad` | Mobile Gaming Trigger Joystick Gamepad |
| 53 | `53-mouse-gamepad-315-x-118-large-mouse-pad` | Mouse Gamepad 31.5 x 11.8 Large Mouse Pad |
| 54 | `54-premium-gaming-controller-pro` | Premium Gaming Controller Pro |
| 55 | `55-rgb-gaming-keyboard-mechanical` | RGB Gaming Keyboard Mechanical |
| 56 | `56-wireless-gaming-mouse-pro` | Wireless Gaming Mouse Pro |

## ⚠️ **Important Rules**

1. **Use EXACT file names**: `1-main.jpg`, `2-angle.jpg`, etc.
2. **All lowercase**: Don't use capital letters
3. **Use dashes, not spaces**: `1-main.jpg` not `1 main.jpg`
4. **5 images per product**: Always include all 5 images
5. **Supported formats**: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`

## 🧪 **Test Your Images**

After adding images, test by:
1. Opening your website in a browser
2. Going to a product page
3. Checking that all 5 images load properly
4. Verifying the image carousel works

## 🚨 **If Images Don't Show**

Check these common issues:
- ❌ File names don't match exactly (case sensitive)
- ❌ Images are in wrong folder
- ❌ File extensions don't match (.jpg vs .jpeg)
- ❌ Missing some of the 5 required images

---

**The JSON is already configured correctly - just add your images to the right folders! 📸✨**