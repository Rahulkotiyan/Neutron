require("dotenv").config();
const { createClient } = require("@libsql/client");
const crypto = require("crypto");

const now = () => new Date().toISOString();

const categories = [
  {
    id: crypto.randomUUID(), name: "Documentation Tools", slug: "documentation-tools", icon: "Book",
    subcategories: [
      {
        name: "Writing & Formatting", slug: "writing-formatting", icon: "EditPencil",
        tools: [
          { title: "Overleaf", description: "Collaborative LaTeX editor for academic papers and reports", url: "https://overleaf.com", icon: "File" },
          { title: "Google Docs", description: "Cloud-based document editor with real-time collaboration", url: "https://docs.google.com", icon: "File" },
          { title: "Notion", description: "All-in-one workspace for docs, notes, and knowledge management", url: "https://notion.so", icon: "Book" },
          { title: "Obsidian", description: "Markdown-based knowledge base with graph view", url: "https://obsidian.md", icon: "BookStack" },
          { title: "LibreOffice", description: "Free open-source office suite for documents and presentations", url: "https://libreoffice.org", icon: "File" },
          { title: "Markdown Guide", description: "Learn Markdown syntax for clean documentation", url: "https://markdownguide.org", icon: "Code" },
        ]
      },
      {
        name: "Citation & References", slug: "citation-references", icon: "Star",
        tools: [
          { title: "Zotero", description: "Free reference manager with browser integration", url: "https://zotero.org", icon: "Star" },
          { title: "Mendeley", description: "Reference manager and PDF organizer for researchers", url: "https://mendeley.com", icon: "Book" },
          { title: "Cite This For Me", description: "Quick citation generator in APA, MLA, Chicago styles", url: "https://citethisforme.com", icon: "Star" },
          { title: "Google Scholar", description: "Search academic papers, theses, and citations", url: "https://scholar.google.com", icon: "Globe" },
          { title: "Semantic Scholar", description: "AI-powered research paper discovery", url: "https://semanticscholar.org", icon: "Brain" },
        ]
      },
      {
        name: "Grammar & Plagiarism", slug: "grammar-plagiarism", icon: "CheckCircle",
        tools: [
          { title: "Grammarly", description: "AI grammar checker with tone and clarity suggestions", url: "https://grammarly.com", icon: "CheckCircle" },
          { title: "QuillBot", description: "Paraphrasing tool with grammar checker and summarizer", url: "https://quillbot.com", icon: "EditPencil" },
          { title: "Turnitin", description: "Academic plagiarism detection and originality checking", url: "https://turnitin.com", icon: "Shield" },
          { title: "DupliChecker", description: "Free online plagiarism checker", url: "https://duplichecker.com", icon: "WarningTriangle" },
          { title: "Hemingway Editor", description: "Improve readability and fix complex sentences", url: "https://hemingwayapp.com", icon: "EditPencil" },
        ]
      },
      {
        name: "Diagrams & Visualization", slug: "diagrams-visualization", icon: "Palette",
        tools: [
          { title: "Draw.io", description: "Free flowchart and diagram maker", url: "https://draw.io", icon: "Palette" },
          { title: "Lucidchart", description: "Professional diagramming for flowcharts and UML", url: "https://lucidchart.com", icon: "Palette" },
          { title: "Canva", description: "Create infographics, posters, and visual content", url: "https://canva.com", icon: "Palette" },
          { title: "Tableau Public", description: "Free data visualization and interactive charts", url: "https://public.tableau.com", icon: "GraphUp" },
          { title: "DataWrapper", description: "Create simple charts and maps for reports", url: "https://datawrapper.de", icon: "GraphUp" },
          { title: "Excalidraw", description: "Virtual whiteboard for sketching diagrams", url: "https://excalidraw.com", icon: "Pen" },
        ]
      },
    ]
  },
  {
    id: crypto.randomUUID(), name: "Project Development Tools", slug: "project-dev-tools", icon: "Code",
    subcategories: [
      {
        name: "Version Control", slug: "version-control", icon: "Code",
        tools: [
          { title: "GitHub", description: "Code hosting with version control and collaboration", url: "https://github.com", icon: "Code" },
          { title: "GitLab", description: "DevOps platform with built-in CI/CD pipelines", url: "https://gitlab.com", icon: "Code" },
          { title: "Git", description: "Distributed version control system", url: "https://git-scm.com", icon: "Code" },
          { title: "Bitbucket", description: "Git repository management for professional teams", url: "https://bitbucket.org", icon: "Code" },
          { title: "Learn Git Branching", description: "Interactive Git tutorial with visual branching", url: "https://learngitbranching.js.org", icon: "Code" },
        ]
      },
      {
        name: "API Testing", slug: "api-testing", icon: "Code",
        tools: [
          { title: "Postman", description: "API development and testing platform", url: "https://postman.com", icon: "Code" },
          { title: "Hoppscotch", description: "Lightweight open-source API request builder", url: "https://hoppscotch.io", icon: "Code" },
          { title: "Insomnia", description: "REST and GraphQL API client with debugging", url: "https://insomnia.rest", icon: "Code" },
          { title: "Swagger Editor", description: "Design and document RESTful APIs with OpenAPI", url: "https://editor.swagger.io", icon: "Code" },
        ]
      },
      {
        name: "Hosting & Deployment", slug: "hosting-deployment", icon: "Globe",
        tools: [
          { title: "Vercel", description: "Frontend hosting with automatic deploys from Git", url: "https://vercel.com", icon: "Globe" },
          { title: "Netlify", description: "Static site hosting with serverless functions", url: "https://netlify.com", icon: "Globe" },
          { title: "Render", description: "Full-stack hosting for web apps and databases", url: "https://render.com", icon: "Globe" },
          { title: "Railway", description: "Quick deploy platform for full-stack apps", url: "https://railway.app", icon: "Globe" },
          { title: "Cloudflare Pages", description: "Fast static site hosting on edge network", url: "https://pages.cloudflare.com", icon: "Globe" },
        ]
      },
      {
        name: "Databases", slug: "databases", icon: "Database",
        tools: [
          { title: "Supabase", description: "Open-source Firebase alternative with PostgreSQL", url: "https://supabase.com", icon: "Database" },
          { title: "Turso", description: "Edge SQLite database for low-latency apps", url: "https://turso.tech", icon: "Database" },
          { title: "MongoDB Atlas", description: "Cloud NoSQL database service", url: "https://mongodb.com/atlas", icon: "Database" },
          { title: "PlanetScale", description: "Serverless MySQL with branching workflows", url: "https://planetscale.com", icon: "Database" },
          { title: "Neon", description: "Serverless PostgreSQL with branching and instant restore", url: "https://neon.tech", icon: "Database" },
        ]
      },
      {
        name: "UI & Design", slug: "ui-design", icon: "Palette",
        tools: [
          { title: "Figma", description: "Collaborative UI/UX design tool", url: "https://figma.com", icon: "Palette" },
          { title: "Tailwind CSS", description: "Utility-first CSS framework", url: "https://tailwindcss.com", icon: "Code" },
          { title: "shadcn/ui", description: "Beautifully designed React component library", url: "https://ui.shadcn.com", icon: "Code" },
          { title: "Dribbble", description: "Design inspiration and portfolio platform", url: "https://dribbble.com", icon: "Palette" },
          { title: "Coolors", description: "Color palette generator", url: "https://coolors.co", icon: "Palette" },
        ]
      },
      {
        name: "Dev Utilities", slug: "dev-utilities", icon: "Tools",
        tools: [
          { title: "DevDocs", description: "Fast offline API documentation browser", url: "https://devdocs.io", icon: "Book" },
          { title: "Regex101", description: "Online regex tester with debugger and explanation", url: "https://regex101.com", icon: "Code" },
          { title: "JSON Formatter", description: "Format, validate, and minify JSON data", url: "https://jsonformatter.curiousconcept.com", icon: "Code" },
          { title: "BundlePhobia", description: "Check npm package size and dependencies", url: "https://bundlephobia.com", icon: "GraphUp" },
          { title: "Carbon", description: "Create and share beautiful code screenshots", url: "https://carbon.now.sh", icon: "Code" },
        ]
      },
    ]
  },
  {
    id: crypto.randomUUID(), name: "Tutorials", slug: "tutorials", icon: "Book",
    subcategories: [
      {
        name: "Web Development", slug: "web-development", icon: "Code",
        tools: [
          { title: "freeCodeCamp", description: "Interactive coding tutorials for web development", url: "https://freecodecamp.org", icon: "Code" },
          { title: "The Odin Project", description: "Full-stack curriculum from beginner to job-ready", url: "https://theodinproject.com", icon: "Book" },
          { title: "MDN Web Docs", description: "Complete web development reference and guides", url: "https://developer.mozilla.org", icon: "Book" },
          { title: "W3Schools", description: "Beginner-friendly web development tutorials", url: "https://w3schools.com", icon: "Book" },
          { title: "Scrimba", description: "Interactive coding screencasts with live editing", url: "https://scrimba.com", icon: "Code" },
        ]
      },
      {
        name: "Programming Languages", slug: "programming-languages", icon: "Code",
        tools: [
          { title: "Python.org Tutorial", description: "Official Python tutorial for beginners", url: "https://docs.python.org/3/tutorial", icon: "Code" },
          { title: "Java Tutorials", description: "Official Java learning resources", url: "https://docs.oracle.com/javase/tutorial", icon: "Code" },
          { title: "Learn C++", description: "Interactive C++ tutorial by LearnCPP", url: "https://learncpp.com", icon: "Code" },
          { title: "Go by Example", description: "Learn Go programming with annotated examples", url: "https://gobyexample.com", icon: "Code" },
          { title: "Rust Book", description: "The official Rust programming language book", url: "https://doc.rust-lang.org/book", icon: "Book" },
        ]
      },
      {
        name: "Data Structures & Algorithms", slug: "dsa", icon: "Calculator",
        tools: [
          { title: "LeetCode", description: "Practice coding problems and prepare for interviews", url: "https://leetcode.com", icon: "Code" },
          { title: "GeeksforGeeks", description: "Computer science tutorials and problem solving", url: "https://geeksforgeeks.org", icon: "Book" },
          { title: "Visualgo", description: "Visualize data structures and algorithms", url: "https://visualgo.net", icon: "GraphUp" },
          { title: "NeetCode", description: "DSA roadmap with video explanations", url: "https://neetcode.io", icon: "Code" },
          { title: "Codeforces", description: "Competitive programming with weekly contests", url: "https://codeforces.com", icon: "Code" },
        ]
      },
      {
        name: "System Design", slug: "system-design", icon: "GraphUp",
        tools: [
          { title: "System Design Primer", description: "Learn large-scale system design patterns", url: "https://github.com/donnemartin/system-design-primer", icon: "Book" },
          { title: "ByteByteGo", description: "System design deep dives with diagrams", url: "https://bytebytego.com", icon: "Book" },
          { title: "High Scalability", description: "Real-world architecture case studies", url: "http://highscalability.com", icon: "GraphUp" },
        ]
      },
      {
        name: "YouTube Channels", slug: "youtube-channels", icon: "VideoCamera",
        tools: [
          { title: "Traversy Media", description: "Web development tutorials and crash courses", url: "https://youtube.com/@TraversyMedia", icon: "VideoCamera" },
          { title: "Fireship", description: "High-intensity code tutorials in 100 seconds", url: "https://youtube.com/@Fireship", icon: "VideoCamera" },
          { title: "Web Dev Simplified", description: "Clear and simple web development tutorials", url: "https://youtube.com/@WebDevSimplified", icon: "VideoCamera" },
          { title: "CodeWithHarry", description: "Programming tutorials in Hindi and English", url: "https://youtube.com/@CodeWithHarry", icon: "VideoCamera" },
          { title: "Net Ninja", description: "Comprehensive web development playlists", url: "https://youtube.com/@NetNinja", icon: "VideoCamera" },
        ]
      },
    ]
  },
  {
    id: crypto.randomUUID(), name: "GitHub Repos", slug: "github-repos", icon: "Code",
    subcategories: [
      {
        name: "Awesome Lists", slug: "awesome-lists", icon: "Star",
        tools: [
          { title: "Awesome", description: "Curated list of awesome lists on every topic", url: "https://github.com/sindresorhus/awesome", icon: "Star" },
          { title: "Awesome for Beginners", description: "Projects with good first issues for new contributors", url: "https://github.com/MunGell/awesome-for-beginners", icon: "Star" },
          { title: "Awesome Selfhosted", description: "Self-hosted alternatives to popular services", url: "https://github.com/awesome-selfhosted/awesome-selfhosted", icon: "Star" },
          { title: "Awesome React", description: "React ecosystem resources and libraries", url: "https://github.com/enaqx/awesome-react", icon: "Star" },
          { title: "Awesome Python", description: "Python frameworks, libraries, and tools", url: "https://github.com/vinta/awesome-python", icon: "Star" },
        ]
      },
      {
        name: "Learning Resources", slug: "learning-resources", icon: "Book",
        tools: [
          { title: "Build Your Own X", description: "Learn by building from scratch: DB, Git, etc.", url: "https://github.com/codecrafters-io/build-your-own-x", icon: "Code" },
          { title: "Project Based Learning", description: "Curated project tutorials across languages", url: "https://github.com/practical-tutorials/project-based-learning", icon: "Book" },
          { title: "Developer Roadmap", description: "Step-by-step roadmaps for dev roles", url: "https://github.com/kamranahmedse/developer-roadmap", icon: "MapPin" },
          { title: "Coding Interview University", description: "Multi-month study plan for software engineering", url: "https://github.com/jwasham/coding-interview-university", icon: "Book" },
          { title: "Tech Interview Handbook", description: "Straight-to-the-point FAANG interview prep", url: "https://github.com/yangshun/tech-interview-handbook", icon: "Book" },
        ]
      },
      {
        name: "Project Starter Kits", slug: "starter-kits", icon: "Tools",
        tools: [
          { title: "Create React App", description: "React starter with zero build config", url: "https://github.com/facebook/create-react-app", icon: "Code" },
          { title: "Vite", description: "Next-gen build tool for modern web projects", url: "https://github.com/vitejs/vite", icon: "Code" },
          { title: "Next.js", description: "React framework for production applications", url: "https://github.com/vercel/next.js", icon: "Code" },
          { title: "Tailwind UI Kit", description: "A collection of Tailwind CSS components", url: "https://github.com/creativetimofficial/tailwind-starter-kit", icon: "Palette" },
          { title: "MERN Starter", description: "MongoDB Express React Node starter template", url: "https://github.com/facebook/create-react-app", icon: "Code" },
        ]
      },
      {
        name: "Developer Tools", slug: "dev-tools", icon: "Tools",
        tools: [
          { title: "Free for Dev", description: "List of free SaaS offerings for developers", url: "https://github.com/ripienaar/free-for-dev", icon: "Tools" },
          { title: "Public APIs", description: "Collective list of free public APIs", url: "https://github.com/public-apis/public-apis", icon: "Code" },
          { title: "Hacker News", description: "Hacker News reader app built with React", url: "https://github.com/facebook/react", icon: "Code" },
          { title: "Open Source Guides", description: "Learn how to run open source projects", url: "https://github.com/github/open-source-guides", icon: "Book" },
        ]
      },
    ]
  },
  {
    id: crypto.randomUUID(), name: "Open Source Projects", slug: "open-source-projects", icon: "Globe",
    subcategories: [
      {
        name: "Web Frameworks", slug: "web-frameworks", icon: "Code",
        tools: [
          { title: "React", description: "UI library by Meta for building component-based interfaces", url: "https://github.com/facebook/react", icon: "Code" },
          { title: "Vue.js", description: "Progressive JavaScript framework", url: "https://github.com/vuejs/vue", icon: "Code" },
          { title: "Angular", description: "Web application framework by Google", url: "https://github.com/angular/angular", icon: "Code" },
          { title: "Express.js", description: "Fast web framework for Node.js", url: "https://github.com/expressjs/express", icon: "Code" },
          { title: "Django", description: "High-level Python web framework", url: "https://github.com/django/django", icon: "Code" },
        ]
      },
      {
        name: "Databases & Infrastructure", slug: "databases-infra", icon: "Database",
        tools: [
          { title: "PostgreSQL", description: "Advanced open-source relational database", url: "https://github.com/postgres/postgres", icon: "Database" },
          { title: "Redis", description: "In-memory data structure store used as cache", url: "https://github.com/redis/redis", icon: "Database" },
          { title: "SQLite", description: "Small, fast, self-contained SQL database engine", url: "https://github.com/sqlite/sqlite", icon: "Database" },
          { title: "Docker", description: "Containerization platform for applications", url: "https://github.com/docker", icon: "Tools" },
          { title: "Kubernetes", description: "Container orchestration for production systems", url: "https://github.com/kubernetes/kubernetes", icon: "Tools" },
        ]
      },
      {
        name: "DevOps & Tools", slug: "devops-tools", icon: "Tools",
        tools: [
          { title: "VS Code", description: "Popular open-source code editor by Microsoft", url: "https://github.com/microsoft/vscode", icon: "Code" },
          { title: "Homebrew", description: "Package manager for macOS", url: "https://github.com/Homebrew/brew", icon: "Tools" },
          { title: "Nginx", description: "High-performance web server and reverse proxy", url: "https://github.com/nginx/nginx", icon: "Globe" },
          { title: "Figma", description: "Open-source collaborative design tool", url: "https://github.com/figma", icon: "Palette" },
          { title: "Babel", description: "JavaScript compiler for modern JS features", url: "https://github.com/babel/babel", icon: "Code" },
        ]
      },
      {
        name: "Student Projects", slug: "student-projects", icon: "Book",
        tools: [
          { title: "First Contributions", description: "Make your first open-source contribution", url: "https://github.com/firstcontributions/first-contributions", icon: "Star" },
          { title: "Hacktoberfest", description: "Annual open-source contribution festival", url: "https://github.com/digitalocean/hacktoberfest", icon: "Star" },
          { title: "GSOC", description: "Google Summer of Code — student open source program", url: "https://summerofcode.withgoogle.com", icon: "Globe" },
          { title: "MLH Fellowship", description: "Remote internship program for aspiring developers", url: "https://github.com/MLH", icon: "Book" },
          { title: "GirlScript Summer of Code", description: "Indian open-source program for students", url: "https://gssoc.girlscript.tech", icon: "Star" },
        ]
      },
    ]
  },
];

async function seed() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) { console.error("TURSO_DATABASE_URL not set"); process.exit(1); }

  const client = createClient({ url, authToken });

  for (const cat of categories) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO tool_categories (id, name, slug, icon, display_order, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)`,
      args: [cat.id, cat.name, cat.slug, cat.icon, categories.indexOf(cat), now()],
    });

    for (const sub of cat.subcategories) {
      const subId = crypto.randomUUID();
      await client.execute({
        sql: `INSERT OR IGNORE INTO tool_subcategories (id, category_id, name, slug, icon, display_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [subId, cat.id, sub.name, sub.slug, sub.icon, cat.subcategories.indexOf(sub), now()],
      });

      for (const tool of sub.tools) {
        const toolId = crypto.randomUUID();
        await client.execute({
          sql: `INSERT OR IGNORE INTO tools (id, subcategory_id, title, description, url, icon, display_order, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
          args: [toolId, subId, tool.title, tool.description, tool.url, tool.icon, sub.tools.indexOf(tool), now()],
        });
      }
    }
  }

  console.log("Tools seed complete!");
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
