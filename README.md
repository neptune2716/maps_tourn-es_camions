# Route Optimizer 🚛🗺️

A modern web application for finding optimal routes between multiple locations, designed for both cars and trucks with advanced customization options.

## Features

- **Multiple Input Methods**: Manual entry, GPS coordinates, or file upload (CSV/Excel)
- **Vehicle-Specific Routing**: Optimized for cars and trucks with appropriate restrictions
- **Flexible Route Control**: Lock locations in specific positions, create loop routes
- **Advanced Optimization**: Choose between shortest distance, fastest time, or balanced algorithms
- **Interactive Map**: Visual route display with turn-by-turn directions
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Maps**: Mapbox GL JS
- **State Management**: Zustand
- **Build Tool**: Vite
- **Testing**: Vitest + Testing Library
- **Linting**: ESLint + Prettier

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Mapbox account and API token (free tier available)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd route-optimizer
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Add your API keys to `.env.local`:
```env
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### API Keys Setup

#### Mapbox (Recommended)
1. Create a free account at [mapbox.com](https://www.mapbox.com/)
2. Generate an access token with the following scopes:
   - `styles:read`
   - `directions:read`
   - `geocoding:read`
3. Add the token to your `.env.local` file

#### Alternative: Google Maps
1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the following APIs:
   - Maps JavaScript API
   - Directions API
   - Geocoding API
3. Create an API key and add it to `.env.local`

## Project Structure

```
src/
├── components/          # React components
│   ├── Layout.tsx      # Main layout wrapper
│   ├── HomePage.tsx    # Landing page
│   └── RouteOptimizer.tsx # Main optimization interface
├── services/           # API and external service integrations
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── hooks/              # Custom React hooks
└── test/               # Test utilities and setup
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage

## Development

### Adding New Features

1. Create feature branch: `git checkout -b feature/feature-name`
2. Implement the feature following existing patterns
3. Add tests for new functionality
4. Update documentation as needed
5. Submit pull request

### Code Style

This project uses ESLint and Prettier for code formatting. Run `npm run lint:fix` to automatically fix formatting issues.

### Testing

Tests are written using Vitest and Testing Library. Run `npm test` to execute the test suite.

## Deployment

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Deployment Options

- **Vercel**: Connect your GitHub repository for automatic deployments
- **Netlify**: Drag and drop the `dist/` folder or connect via Git
- **AWS S3**: Upload the `dist/` contents to an S3 bucket with static hosting
- **GitHub Pages**: Use GitHub Actions to deploy from the `dist/` folder

### Environment Variables for Production

Make sure to set these environment variables in your hosting platform:

- `VITE_MAPBOX_ACCESS_TOKEN`
- `VITE_APP_ENV=production`
- Any other API keys you're using

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the TODO.md file for planned features

## Roadmap

See [TODO.md](./TODO.md) for the complete development roadmap and current progress.

---

Built with ❤️ using modern web technologies
