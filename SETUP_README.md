# API Documentation Website - Setup Guide

## 📁 Folder Structure

```
your-frontend-project/
├── public/
│   └── docs/                      # Place all .md files here
│       ├── src_Api_Controller_Animal_DeleteAnimalPhotoAction_php.md
│       ├── src_Api_Controller_Animal_UploadAnimalPhotoAction_php.md
│       └── ... (all 5000+ .md files)
│
├── src/
│   ├── data/
│   │   └── documentation.json     # Auto-generated (don't edit manually)
│   │
│   ├── types/
│   │   └── documentation.ts       # TypeScript types
│   │
│   ├── pages/
│   │   ├── Documentation.tsx      # Main documentation viewer
│   │   ├── Home.tsx
│   │   ├── Overview.tsx
│   │   └── ...
│   │
│   └── router.tsx                 # Updated with /docs route
│
├── scripts/
│   └── generateDocsData.js        # Script to parse SUMMARY.md
│
├── SUMMARY.md                     # Your documentation index
└── package.json
```

## 🚀 Setup Instructions

### Step 1: Install Dependencies

Make sure you have Node.js installed, then run:

```bash
npm install
```

### Step 2: Organize Documentation Files

1. **Create the `public/docs` folder:**
   ```bash
   mkdir -p public/docs
   ```

2. **Copy all your .md files to `public/docs`:**
   ```bash
   cp path/to/your/md/files/*.md public/docs/
   ```

   Make sure the filenames match exactly what's in SUMMARY.md. For example:
   - `src_Api_Controller_Animal_DeleteAnimalPhotoAction_php.md`
   - `src_components_b2c_accordion_json.md`

### Step 3: Place SUMMARY.md

Copy your `SUMMARY.md` file to the root of the project:

```bash
cp path/to/SUMMARY.md .
```

### Step 4: Generate Documentation JSON

Add this script to your `package.json`:

```json
{
  "scripts": {
    "generate-docs": "node scripts/generateDocsData.js",
    "dev": "npm run generate-docs && vite",
    "build": "npm run generate-docs && tsc && vite build"
  }
}
```

Then run:

```bash
npm run generate-docs
```

This will:
- Parse SUMMARY.md
- Categorize files (Backend/Frontend/Other)
- Generate `src/data/documentation.json`
- Create a search index

### Step 5: Start the Development Server

```bash
npm run dev
```

Navigate to: `http://localhost:5173/docs`

## 📊 How It Works

### File Categorization

Files are automatically categorized based on their extension:

- **Backend**: `.php` files (Symfony controllers, services, entities)
- **Frontend**: `.js`, `.json`, `.jsx`, `.ts`, `.tsx`, `.vue` files (Strapi CMS, Vue components)
- **Other**: Everything else

### Search Functionality

- **Full-text search** across file names, paths, sections
- **Category filtering** (All/Backend/Frontend)
- **Real-time results** as you type

### File Tree Navigation

- **Hierarchical structure** based on your SUMMARY.md sections
- **Expandable/collapsible** categories
- **File count badges** for each section

## 🎨 Customization

### Changing Colors

Edit the colors in `src/pages/Documentation.tsx`:

```typescript
// Primary color (currently emerald)
className="bg-[#024639]"  // Change #024639 to your color

// Category badges
backend: 'bg-emerald-600'   // PHP files
frontend: 'bg-blue-600'     // JS files
```

### Adding More Categories

Edit `scripts/generateDocsData.js`:

```javascript
const BACKEND_EXTENSIONS = ['.php', '.java'];  // Add more
const FRONTEND_EXTENSIONS = ['.js', '.json', '.ts', '.vue'];  // Add more
const MOBILE_EXTENSIONS = ['.dart', '.swift'];  // New category
```

### Customizing File Display

You can parse and render markdown properly by installing:

```bash
npm install marked
npm install @types/marked --save-dev
```

Then in `Documentation.tsx`:

```typescript
import { marked } from 'marked';

// In your component:
const htmlContent = marked(fileContent);
<div dangerouslySetInnerHTML={{ __html: htmlContent }} />
```

## 📝 Features

### ✅ Implemented

- [x] Parse 5000+ files from SUMMARY.md
- [x] Categorize into Backend/Frontend/Other
- [x] Search functionality
- [x] Category filtering
- [x] File tree navigation
- [x] Responsive design
- [x] Mobile-friendly sidebar

### 🔄 To Implement (Optional)

- [ ] Markdown rendering with syntax highlighting
- [ ] Code syntax highlighting (using Prism.js or highlight.js)
- [ ] Breadcrumb navigation
- [ ] Recently viewed files
- [ ] Favorites/bookmarks
- [ ] Dark mode
- [ ] Export documentation as PDF

## 🐛 Troubleshooting

### Documentation not loading?

1. Check if `documentation.json` exists in `src/data/`
2. Run `npm run generate-docs` again
3. Check browser console for errors

### Files not found (404)?

1. Verify .md files are in `public/docs/`
2. Check filename matches exactly (case-sensitive)
3. Check network tab in browser dev tools

### Search not working?

1. Clear browser cache
2. Rebuild: `npm run generate-docs`
3. Check if searchIndex exists in documentation.json

## 📦 Production Build

```bash
npm run build
```

This will:
1. Generate documentation.json
2. Compile TypeScript
3. Build optimized production bundle

Deploy the `dist/` folder to your hosting service.

## 🔗 Navigation

Access the documentation at: `/docs`

You can link to it from your Home page:

```tsx
<button onClick={() => navigate('/docs')}>
  View Documentation
</button>
```

## 📚 Additional Resources

- [React Router Docs](https://reactrouter.com/)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [shadcn/ui Components](https://ui.shadcn.com/)

## 🤝 Support

If you encounter issues:
1. Check this README
2. Verify all files are in correct locations
3. Check browser console for errors
4. Ensure all dependencies are installed

---

**Happy documenting! 🎉**