# Assets Organization

This directory contains all frontend assets organized in a modular, maintainable structure.

## Directory Structure

```
assets/
├── css/
│   ├── base/           # Foundation styles
│   │   ├── reset.css       # CSS resets and utilities
│   │   ├── typography.css  # Typography system
│   │   └── variables.css   # CSS variables/themes
│   ├── components/     # Reusable component styles
│   │   ├── buttons.css     # Button styles
│   │   ├── forms.css       # Form elements
│   │   ├── modals.css     # Modal styles
│   │   └── cards.css      # Card/task styles
│   ├── layout/        # Layout modules
│   │   ├── header.css     # Header styles
│   │   ├── sidebar.css    # Sidebar styles
│   │   ├── kanban.css    # Kanban board layout
│   │   └── responsive.css # Responsive rules
│   └── main.css       # Main CSS importer
├── js/
│   ├── config/        # Configuration
│   │   ├── api.config.js  # API settings
│   │   └── app.config.js  # App settings
│   ├── services/      # Core services
│   │   ├── api.service.js # API client
│   │   └── auth.service.js # Auth logic
│   ├── components/    # UI Components
│   │   ├── board.js      # Board logic
│   │   ├── tasks.js      # Task management
│   │   └── modals.js     # Modal handling
│   ├── utils/         # Helper functions
│   │   ├── dom.js        # DOM utilities
│   │   └── validation.js # Form validation
│   └── app.js         # Main entry point
└── vendor/           # Third-party libraries
    ├── axios.min.js
    └── sortable.min.js

## CSS Organization

- **Base**: Foundation styles, resets, and variables
- **Components**: Individual component styles
- **Layout**: Page structure and responsive layouts

## JavaScript Organization

- **Config**: Environment and feature configuration
- **Services**: Core business logic and API integration
- **Components**: UI component logic
- **Utils**: Reusable helper functions

## Usage

1. Import CSS in HTML:
```html
<link rel="stylesheet" href="assets/css/main.css">
```

2. Import JavaScript in HTML:
```html
<!-- Vendor libraries -->
<script src="assets/vendor/axios.min.js"></script>
<script src="assets/vendor/sortable.min.js"></script>

<!-- Application code -->
<script type="module" src="assets/js/app.js"></script>
```

## Best Practices

1. Keep components small and focused
2. Use CSS variables for theming
3. Follow naming conventions:
   - CSS: BEM methodology
   - JS: camelCase for functions/variables
   - Files: kebab-case
4. Document complex functions and components
5. Keep third-party code in vendor/