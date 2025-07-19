# Route Optimizer 🚛🗺️

A modern web application for finding optimal routes between multiple locations, designed for both cars and trucks with advanced customization options and French address support.

## ✨ Current Features

- ✅ **Smart Address Autocomplete**: Real-time French address suggestions with accent normalization
- ✅ **Multiple Input Methods**: Manual entry with GPS coordinates auto-retrieval
- ✅ **Vehicle-Specific Routing**: Optimized for cars and trucks
- ✅ **Interactive Map**: OpenStreetMap integration with route visualization
- ✅ **Free Solution**: No API keys required, no credit card needed
- ✅ **French Support**: Handles accents (é→e), ligatures (œ→oe), and partial city names
- ✅ **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🚀 Tech Stack

- ✅ **Frontend**: React 18 + TypeScript
- ✅ **Styling**: Tailwind CSS with custom components  
- ✅ **Maps**: OpenStreetMap + Leaflet (100% free)
- ✅ **Geocoding**: Nominatim API (free OpenStreetMap service)
- ✅ **Routing**: OSRM API (free routing service)
- ✅ **Build Tool**: Vite with hot reload
- ✅ **Linting**: ESLint + Prettier + TypeScript strict mode

## 🎯 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- ⚡ **No API keys required!** - Everything works out of the box

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd maps_tournées_camions
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### 🆓 No Setup Required!

Unlike other mapping solutions, this project uses 100% free services:
- **No Mapbox account needed**
- **No Google Cloud setup required**  
- **No API key management**
- **No credit card required**
- **No usage limits for reasonable use**

## 📁 Project Structure

```
src/
├── components/              # React components
│   ├── Layout.tsx          # Main layout wrapper
│   ├── HomePage.tsx        # Landing page
│   ├── RouteOptimizer.tsx  # Main optimization interface
│   ├── AddressAutocomplete.tsx # Smart address input
│   └── OpenStreetMapComponent.tsx # Map display
├── services/               # API integrations
│   └── freeRoutingService.ts # Nominatim + OSRM integration
├── hooks/                  # Custom React hooks
│   └── useAddressSearch.ts # Address autocomplete logic
├── types/                  # TypeScript definitions
└── utils/                  # Utility functions
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

## 🌟 Key Features Details

### Smart Address Autocomplete
- **Real-time suggestions** as you type
- **French accent handling**: "allee" finds "Allée"
- **Partial city names**: "61 rue exemple, Pari" suggests Paris locations
- **Keyboard navigation**: Arrow keys, Enter, Escape support
- **GPS coordinates**: Automatically retrieved for selected addresses

### Address Input Examples
```
✅ "Tour Eiffel" → Finds Eiffel Tower, Paris
✅ "allee du clos masnil, olivet" → Finds exact street in Olivet  
✅ "61 rue republique, ly" → Suggests Lyon, Lyonens, etc.
✅ "église saint-paul" → Finds churches (accent normalization)
```

### Free Mapping Stack
- **OpenStreetMap**: Community-driven map data
- **Nominatim**: Geocoding and address search
- **OSRM**: Route calculation and optimization
- **Leaflet**: Interactive map display

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deployment Options

- **Vercel**: `vercel --prod` (recommended)
- **Netlify**: Connect via Git or drag & drop `dist/`
- **GitHub Pages**: Deploy from `dist/` folder
- **Any static hosting**: Upload `dist/` contents

### 🔒 Production Environment

No environment variables needed! The app works entirely with free public APIs.

## 🔄 Development Status

**Current Phase**: Phase 2 Complete ✅  
**Next Phase**: File Upload System & Advanced Location Management

See [TODO.md](./TODO.md) for complete roadmap and progress tracking.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

- 📋 Create an issue for bugs or feature requests
- 📖 Check [TODO.md](./TODO.md) for planned features
- 🔧 Review component documentation in source files

---

🇫🇷 **Built for French users** with ❤️ using modern web technologies and 100% free services
