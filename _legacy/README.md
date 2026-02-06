# Business Template - Computer Repair Services

A professional, responsive website template for individual computer repair businesses. Built with Node.js and optimized for Vercel deployment.

## Features

- **Responsive Design**: Mobile-first approach that works on all devices
- **Professional Layout**: Clean, modern design with hero section, services, about, and contact
- **Contact Information**: Prominent display of phone, email, and social media links
- **Service Showcase**: Dedicated section highlighting repair services
- **Call-to-Action Buttons**: Strategic placement to drive customer engagement
- **Contact Form**: Functional contact form with validation
- **SEO Optimized**: Proper meta tags and semantic HTML structure
- **Fast Loading**: Optimized for performance and user experience

## Template Components

### Hero Section
- Large hero image representing computer repair services
- Compelling headline and tagline
- Call-to-action buttons (Get Quote, Call Now)
- Professional service description

### About Section
- Profile picture of business owner
- Contact information (phone, email)
- Social media links (Facebook, LinkedIn, Twitter)
- Professional bio and experience

### Services Section
- Six main service categories:
  - Laptop Repair
  - Desktop Repair
  - Virus Removal
  - Data Recovery
  - Performance Tuning
  - Setup & Installation

### Contact Section
- Contact form with validation
- Business hours
- Multiple contact methods
- Professional inquiry handling

## Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd base-template
npm install
```

### 2. Customize Content
Edit the following files to match your business:

- `public/index.html`: Update business name, contact info, and content
- `public/styles.css`: Customize colors, fonts, and styling
- `public/images/`: Replace placeholder images with your own

### 3. Update Business Information

Replace the placeholder information:
- **Business Name**: "TechFix Solutions" → Your Business Name
- **Owner Name**: "John Smith" → Your Name
- **Phone**: "(555) 123-4567" → Your Phone Number
- **Email**: "john@techfixsolutions.com" → Your Email
- **Social Media**: Update all social media links

### 4. Replace Images

Add your images to `public/images/`:
- `computer-repair-hero.jpg` (1200x600px) - Hero section image
- `profile-picture.jpg` (300x300px) - Your professional headshot

### 5. Run Locally
```bash
npm run dev
```
Visit `http://localhost:3000` to see your site.

## Deployment to Vercel

### Option 1: Vercel CLI
```bash
npm install -g vercel
vercel
```

### Option 2: GitHub Integration
1. Push your code to a GitHub repository
2. Connect your GitHub account to Vercel
3. Import your repository
4. Deploy automatically

### Option 3: Drag & Drop
1. Run `npm run build` (if applicable)
2. Drag the project folder to Vercel dashboard

## Customization Guide

### Colors
The template uses a blue/purple gradient theme. To change colors, update these CSS variables in `styles.css`:

```css
/* Primary colors */
--primary-blue: #2563eb;
--primary-purple: #667eea;
--accent-orange: #f59e0b;
```

### Content Sections
Each section can be customized:

1. **Navigation**: Update menu items in the navbar
2. **Hero**: Modify headline, tagline, and description
3. **About**: Replace bio content and contact details
4. **Services**: Add/remove services or change descriptions
5. **Contact**: Update contact information and form fields

### Adding New Sections
To add new sections:

1. Add HTML structure in `index.html`
2. Add corresponding styles in `styles.css`
3. Update navigation menu if needed
4. Add smooth scrolling functionality in `script.js`

## SEO Optimization

The template includes:
- Semantic HTML structure
- Meta descriptions and titles
- Alt tags for images
- Structured data markup ready
- Fast loading optimizations

## Performance Features

- Optimized CSS and JavaScript
- Compressed images (when properly optimized)
- Minimal external dependencies
- Efficient loading strategies

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Dependencies

- **Express.js**: Web server framework
- **Font Awesome**: Icons for social media and services
- **Google Fonts**: Typography (loaded via CDN)

## File Structure

```
base-template/
├── public/
│   ├── images/
│   │   └── README.md
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── server.js
├── package.json
├── vercel.json
└── README.md
```

## Support and Customization

This template is designed to be easily customizable for any individual service business. Key areas to personalize:

1. **Branding**: Colors, fonts, logo
2. **Content**: Services, about information, contact details
3. **Images**: Professional photos of you and your work
4. **Social Media**: Your actual social media profiles

## License

This template is provided as-is for business use. Customize as needed for your specific requirements.

## Tips for Success

1. **Professional Photos**: Invest in quality photos of yourself and your work
2. **Clear Contact Info**: Make it easy for customers to reach you
3. **Regular Updates**: Keep your services and information current
4. **Mobile Testing**: Always test on mobile devices
5. **Fast Loading**: Optimize images for web use

## Next Steps

After deployment:
1. Set up Google Analytics
2. Add Google My Business integration
3. Implement contact form backend
4. Add customer testimonials
5. Set up SEO tools and monitoring
