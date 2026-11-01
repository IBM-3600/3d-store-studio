# 3D Store Studio

A professional web-based 3D store editor for creating and managing virtual shopping experiences.

## Features

- **Visual 3D Editor**: Drag-and-drop product placement in a Three.js-powered viewport
- **Shopify Integration**: Automatic product synchronization from Shopify
- **Real-time Collaboration**: Multiple editors can work simultaneously with object locking
- **Asset Management**: Upload and manage 3D models, textures, and other assets
- **Publishing Pipeline**: Version control and one-click publishing
- **Analytics Dashboard**: Track store traffic, product interactions, and conversions
- **Plugin Architecture**: Extensible system for adding new commerce platforms

## Tech Stack

### Frontend
- Vanilla JavaScript (ES Modules)
- Three.js
- Web Components
- IndexedDB for offline caching
- Chart.js for analytics

### Backend
- Node.js + TypeScript
- Express.js
- PostgreSQL + Prisma
- Redis + BullMQ
- Socket.io for real-time features

## Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Shopify API credentials (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/IBM-3600/3d-store-studio.git
cd 3d-store-studio