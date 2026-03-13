/**
 * PFDA Background Setup Guide
 * 
 * To add a professional PFDA background image to the login page:
 * 
 * RECOMMENDED FREE IMAGE SOURCES:
 * ==============================
 * 
 * 1. Pexels (https://www.pexels.com)
 *    Search terms: "fishing", "fishermen", "port", "maritime", "aquaculture"
 *    These are free high-quality images with no attribution required
 * 
 * 2. Unsplash (https://unsplash.com)
 *    Search: "fishing", "fish farm", "harbor", "water"
 * 
 * 3. Pixabay (https://pixabay.com)
 *    Search: "fisheries", "seafood industry", "maritime"
 * 
 * 4. Pixelize.ai or similar (for generating maritime scenes)
 * 
 * RECOMMENDED IMAGE CHARACTERISTICS:
 * ==================================
 * - Dark tones (blues, teals, dark greens) for professional look
 * - Maritime/fishing related (boats, nets, water, fish)
 * - High resolution (at least 1920x1080)
 * - Not too busy - should work well with overlay
 * 
 * SETUP INSTRUCTIONS:
 * ===================
 * 
 * 1. Download your chosen image
 * 2. Place it in: /public/pfda-bg.jpg (or .png)
 * 3. Update the login page URL:
 *    From:  style={{ background: 'linear-gradient(...)' }}
 *    To:    style={{ backgroundImage: 'url(/pfda-bg.jpg)', ... }}
 * 
 * ALTERNATIVE CURRENT SETUP:
 * ==========================
 * Currently using a CSS gradient that represents:
 * - Dark Ocean Blue (#0a1f3f to #1a5a8f)
 * - Professional maritime theme
 * - With animated floating water effect circles
 * 
 * This works well without an image, but an actual image would be better!
 * 
 * RECOMMENDED SPECIFIC IMAGES:
 * ===========================
 * 
 * For PFDA specifically (Philippine Fisheries):
 * - Fish farm/aquaculture operations
 * - Traditional fishing boats/bangka boats
 * - Harbor/port scenes with fishing activity
 * - Water/ocean backdrops with warm golden hour lighting
 * 
 * Save with overlay: Since we use a black/dark overlay (bg-black/20),
 * choose images that look good slightly darkened.
 */

// Example implementation if you add an image:
// 
// <div 
//   className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden"
//   style={{
//     backgroundImage: 'url(/pfda-bg.jpg)',
//     backgroundSize: 'cover',
//     backgroundPosition: 'center',
//     backgroundAttachment: 'fixed',
//   }}
// >
