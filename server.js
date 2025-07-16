// server.js
// Load environment variables from .env file in development.
// In production, these are typically set directly in the hosting environment.
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
  }
  
  const express = require('express');
  const path = require('path');
  const cors = require('cors');
  const helmet = require('helmet'); // For setting security-related HTTP headers
  const compression = require('compression'); // For compressing response bodies
  const winston = require('winston'); // For robust logging
  // const rateLimit = require('express-rate-limit'); // Optional: for API rate limiting
  
  const app = express();
  
  // --- Environment Variables ---
  // Use process.env.PORT for hosting platforms, fallback to 3000 for local development
  const PORT = process.env.PORT || 3000;
  // Set NODE_ENV to 'production' on your hosting platform for production-specific behavior
  const NODE_ENV = process.env.NODE_ENV || 'development';
  
  // --- Logging Setup (Winston) ---
  const logger = winston.createLogger({
    level: NODE_ENV === 'production' ? 'info' : 'debug', // Log level: info in prod, debug in dev
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }), // Log stack traces for errors
      winston.format.splat(), // Allows for string interpolation
      winston.format.json() // Output logs in JSON format for easy parsing by log management systems
    ),
    transports: [
      new winston.transports.Console({
        // In development, use pretty-printed console output
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }),
      // In production, consider adding file transports or sending to external logging services (e.g., Loggly, Datadog)
      // new winston.transports.File({ filename: 'error.log', level: 'error' }),
      // new winston.transports.File({ filename: 'combined.log' }),
    ],
  });
  
  // --- Middleware ---
  app.use(express.json()); // Parses incoming requests with JSON payloads
  app.use(express.urlencoded({ extended: true })); // Parses incoming requests with URL-encoded payloads
  
  // Security middleware: Helps secure your apps by setting various HTTP headers
  app.use(helmet());
  
  // CORS (Cross-Origin Resource Sharing) configuration
  // IMPORTANT: In production, replace 'https://your-angular-app-domain.com' with your actual frontend URL.
  // Using '*' in production is a security risk unless your API is truly public.
  const corsOptions = {
    origin: NODE_ENV === 'production' ? 'https://your-angular-app-domain.com' : '*', // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed request headers
    credentials: true // Allow cookies to be sent (if using session/cookie-based auth)
  };
  app.use(cors(corsOptions));
  
  // Compression middleware: Compresses response bodies for all requests
  app.use(compression());
  
  // // Optional: Rate limiting middleware to protect against brute-force attacks
  // const apiLimiter = rateLimit({
  //   windowMs: 15 * 60 * 1000, // 15 minutes
  //   max: 100, // Limit each IP to 100 requests per windowMs
  //   message: 'Too many requests from this IP, please try again after 15 minutes'
  // });
  // // Apply to all API routes, or specific routes like: app.use('/api/', apiLimiter);
  // app.use(apiLimiter);
  
  
  // --- API Routes ---
  // These are placeholder routes. Replace with your actual database interactions.
  // For a real application, you'd typically separate these into a 'routes' folder.
  
  // Mock data storage (replace with a real database like MongoDB, PostgreSQL, etc.)
  let blogPosts = [
    {
      id: 'post_1678886400000',
      title: 'First Blog Post',
      snippet: 'A short introduction to my blog.',
      fullContent: 'This is the full content of the first blog post. It covers various topics related to web development and personal experiences.',
      author: 'Sourabh Madane',
      date: '2023-03-15',
      timestamp: 1678886400000,
      images: []
    },
    {
      id: 'post_1678972800000',
      title: 'Angular Standalone Components',
      snippet: 'Exploring the new features in Angular 17+.',
      fullContent: 'Dive deep into Angular 17\'s standalone components, a feature that simplifies the Angular development experience by removing the need for NgModules.',
      author: 'Sourabh Madane',
      date: '2023-03-16',
      timestamp: 1678972800000,
      images: [
        { url: 'https://placehold.co/600x400/87CEFA/FFFFFF?text=Angular+17', prompt: 'Angular 17 logo concept' },
        { url: 'https://placehold.co/600x400/D4BFFF/FFFFFF?text=Standalone', prompt: 'Code snippets for standalone components' }
      ]
    }
  ];
  
  // GET all posts
  app.get('/api/posts', (req, res) => {
      logger.info('GET /api/posts requested');
      res.json(blogPosts);
  });
  
  // POST a new post
  app.post('/api/posts', (req, res) => {
      const newPost = {
          id: `post_${Date.now()}`, // Generate a unique ID
          timestamp: Date.now(),    // Add a timestamp
          ...req.body
      };
      blogPosts.push(newPost);
      logger.info('POST /api/posts - New post created:', newPost.title);
      res.status(201).json(newPost); // Respond with the created post and 201 status
  });
  
  // PUT (update) an existing post
  app.put('/api/posts/:id', (req, res) => {
      const postId = req.params.id;
      const updatedPostData = req.body;
      const index = blogPosts.findIndex(p => p.id === postId);
  
      if (index !== -1) {
          // Preserve original timestamp and ID if not provided in update
          blogPosts[index] = { ...blogPosts[index], ...updatedPostData, id: postId };
          logger.info(`PUT /api/posts/${postId} - Post updated:`, blogPosts[index].title);
          res.json(blogPosts[index]);
      } else {
          logger.warn(`PUT /api/posts/${postId} - Post not found.`);
          res.status(404).json({ message: 'Post not found' });
      }
  });
  
  // DELETE a post
  app.delete('/api/posts/:id', (req, res) => {
      const postId = req.params.id;
      const initialLength = blogPosts.length;
      blogPosts = blogPosts.filter(p => p.id !== postId);
  
      if (blogPosts.length < initialLength) {
          logger.info(`DELETE /api/posts/${postId} - Post deleted.`);
          res.status(204).send(); // 204 No Content for successful deletion
      } else {
          logger.warn(`DELETE /api/posts/${postId} - Post not found.`);
          res.status(404).json({ message: 'Post not found' });
      }
  });
  
  
  // --- Serve Angular Frontend in Production ---
  // In production, your Node.js server can serve the optimized static files of your Angular app.
  // This assumes your Angular project ('blog-app') is a sibling directory to your 'backend' directory.
  if (NODE_ENV === 'production') {
    // IMPORTANT: Adjust this path based on your actual project structure.
    // Example: If server.js is in 'backend/' and Angular dist is in 'blog-app/dist/blog-app/browser/'
    const angularDistPath = path.join(__dirname, '..', 'SourabhMadane');
    logger.info(`Serving static Angular files from: ${angularDistPath}`);
  
    // Serve static files from the Angular build output directory
    app.use(express.static(angularDistPath));
  
    // For any other GET request (not an API route), serve the Angular index.html.
    // This is crucial for Angular's client-side routing (deep linking).
    app.get('*', (req, res) => {
      res.sendFile(path.join(angularDistPath, 'index.html'));
    });
  }
  
  // --- Centralized Error Handling Middleware ---
  // This middleware catches errors that occur in your routes or other middleware.
  app.use((err, req, res, next) => {
    logger.error(`Unhandled Error: ${err.message}`, {
      stack: err.stack,
      path: req.path,
      method: req.method,
      body: req.body,
      ip: req.ip
    });
    res.status(err.status || 500).json({
      message: 'An unexpected error occurred. Please try again later.',
      // In production, avoid sending detailed error stack to the client for security reasons.
      error: NODE_ENV === 'development' ? err : {}
    });
  });
  
  // --- Process Event Listeners (for unhandled exceptions/rejections) ---
  // These help prevent the Node.js process from crashing on unhandled errors.
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // In a production app, you might want to send an alert and/or gracefully shut down.
    // process.exit(1); // Consider exiting for critical unhandled rejections
  });
  
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    // This is a critical error. It's often best to exit the process and let a process manager (like PM2) restart it.
    process.exit(1); // Exit with a failure code
  });
  
  
  // --- Start Server ---
  app.listen(PORT, () => {
    logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`);
    if (NODE_ENV === 'production') {
      logger.info(`IMPORTANT: Ensure CORS origin is set to your Angular app's domain: ${corsOptions.origin}`);
      logger.info('To run in production mode, set NODE_ENV=production in your environment variables.');
    }
  });
  