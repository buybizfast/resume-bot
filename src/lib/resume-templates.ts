export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  html: string;
}

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean, traditional layout ideal for most industries',
    html: `<h1>[Your Name]</h1>
<p style="text-align: center;">[your.email@email.com] | [555-123-4567] | [City, State] | <a href="#">LinkedIn: linkedin.com/in/yourprofile</a></p>

<h2>Professional Summary</h2>
<p>Results-driven professional with [X+] years of experience in [industry/field]. Proven track record of [key achievement or skill area], with a strong ability to [relevant competency]. Seeking to leverage expertise in [specific area] to drive [measurable outcome] at [Target Company or role type].</p>

<h2>Work Experience</h2>

<h3>Senior [Job Title] | [Company Name] | [City, State] | [Start Date] \u2013 Present</h3>
<ul>
<li>Led a team of [X] professionals to deliver [project/initiative], resulting in a [X%] increase in [metric]</li>
<li>Developed and implemented [strategy/process] that reduced [cost/time/errors] by [X%] over [time period]</li>
<li>Managed $[X]M budget and consistently delivered projects on time and under budget</li>
<li>Collaborated with cross-functional teams including [departments] to achieve [business objective]</li>
<li>Recognized with [award/recognition] for outstanding performance in [area]</li>
</ul>

<h3>[Job Title] | [Company Name] | [City, State] | [Start Date] \u2013 [End Date]</h3>
<ul>
<li>Spearheaded [initiative/project] that generated $[X]K in new revenue within [time period]</li>
<li>Streamlined [process/workflow] resulting in [X%] improvement in operational efficiency</li>
<li>Built and maintained relationships with [X+] key stakeholders and clients</li>
<li>Trained and mentored [X] junior team members, improving team productivity by [X%]</li>
</ul>

<h2>Skills</h2>
<p>Project Management | Strategic Planning | Team Leadership | Budget Management | Data Analysis | Stakeholder Communication | Process Improvement | [Skill] | [Skill] | [Skill]</p>

<h2>Education</h2>
<h3>[Degree, e.g. Bachelor of Science in Business Administration] | [University Name] | [Graduation Year]</h3>
<p>Relevant Coursework: [Course 1], [Course 2], [Course 3]</p>
<p>GPA: [X.XX/4.00] (include if 3.5+)</p>`,
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Optimized for software engineering and IT roles',
    html: `<h1>[Your Name]</h1>
<p style="text-align: center;">[your.email@email.com] | [555-123-4567] | [City, State] | <a href="#">LinkedIn: linkedin.com/in/yourprofile</a> | <a href="#">GitHub: github.com/yourusername</a></p>

<h2>Professional Summary</h2>
<p>Software engineer with [X+] years of experience designing, building, and shipping scalable applications. Expertise in [primary tech stack] with a focus on [specialization, e.g. distributed systems, front-end architecture, cloud infrastructure]. Passionate about writing clean, well-tested code and mentoring engineering teams.</p>

<h2>Technical Skills</h2>
<p><strong>Languages:</strong> [JavaScript, TypeScript, Python, Go, Java, C++, SQL]</p>
<p><strong>Frameworks &amp; Libraries:</strong> [React, Next.js, Node.js, Express, Django, Spring Boot]</p>
<p><strong>Databases:</strong> [PostgreSQL, MySQL, MongoDB, Redis, DynamoDB]</p>
<p><strong>Cloud &amp; DevOps:</strong> [AWS, GCP, Azure, Docker, Kubernetes, Terraform, CI/CD]</p>
<p><strong>Tools &amp; Practices:</strong> [Git, GitHub Actions, Jest, Cypress, Agile/Scrum, REST, GraphQL]</p>

<h2>Work Experience</h2>

<h3>Senior Software Engineer | [Company Name] | [City, State] | [Start Date] \u2013 Present</h3>
<ul>
<li>Architected and implemented a [microservice/feature/system] serving [X]M+ requests per day with 99.9% uptime</li>
<li>Reduced API response latency by [X%] through query optimization and caching strategies using [technology]</li>
<li>Led migration from [legacy system] to [modern stack], eliminating $[X]K/year in infrastructure costs</li>
<li>Mentored [X] junior engineers through code reviews, pair programming, and technical design sessions</li>
<li>Introduced [testing strategy/CI pipeline/monitoring] that decreased production incidents by [X%]</li>
</ul>

<h3>Software Engineer | [Company Name] | [City, State] | [Start Date] \u2013 [End Date]</h3>
<ul>
<li>Built a real-time [feature, e.g. notification system, data pipeline] using [technology] processing [X]K events per second</li>
<li>Developed RESTful APIs and GraphQL endpoints consumed by [X] client applications with [X]K+ active users</li>
<li>Improved test coverage from [X%] to [X%] by implementing unit, integration, and end-to-end testing with [framework]</li>
<li>Collaborated with product and design teams to deliver [feature] that increased user engagement by [X%]</li>
</ul>

<h2>Projects</h2>

<h3>[Project Name] | <a href="#">github.com/yourusername/project</a></h3>
<ul>
<li>[Brief description of what the project does and the problem it solves]</li>
<li>Built with [tech stack], featuring [notable technical aspects, e.g. real-time updates, OAuth2, WebSocket support]</li>
<li>[X]+ GitHub stars | [X]+ downloads/users</li>
</ul>

<h3>[Project Name] | <a href="#">github.com/yourusername/project</a></h3>
<ul>
<li>[Brief description of what the project does and the problem it solves]</li>
<li>Built with [tech stack], deployed on [platform] with [CI/CD tool]</li>
</ul>

<h2>Education</h2>
<h3>[Degree, e.g. Bachelor of Science in Computer Science] | [University Name] | [Graduation Year]</h3>
<p>Relevant Coursework: Data Structures, Algorithms, Operating Systems, Distributed Systems, Database Design</p>

<h2>Certifications</h2>
<p>[AWS Certified Solutions Architect] | [Certification Name] | [Certification Name]</p>`,
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Modern layout for marketing, design, and creative roles',
    html: `<h1>[Your Name]</h1>
<p style="text-align: center;">[your.email@email.com] | [555-123-4567] | [City, State] | <a href="#">LinkedIn: linkedin.com/in/yourprofile</a> | <a href="#">Portfolio: yourportfolio.com</a></p>

<h2>Professional Summary</h2>
<p>Creative professional with [X+] years of experience in [brand strategy, content marketing, graphic design, UX/UI design]. Skilled at translating business objectives into compelling visual and written narratives that resonate with target audiences. Proven ability to manage campaigns from concept through execution, driving measurable growth in [engagement, brand awareness, conversions].</p>

<h2>Work Experience</h2>

<h3>Senior [Creative Director / Brand Manager / Content Strategist] | [Company Name] | [City, State] | [Start Date] \u2013 Present</h3>
<ul>
<li>Directed end-to-end creative strategy for [brand/product], increasing brand awareness by [X%] across [channels]</li>
<li>Led a cross-functional team of [X] designers, copywriters, and videographers to produce [X]+ campaigns per quarter</li>
<li>Conceived and launched a [content series/campaign] that generated [X]M+ impressions and [X]K+ engagements</li>
<li>Managed an annual creative budget of $[X]K, optimizing spend to achieve a [X:1] return on ad spend</li>
<li>Redesigned [brand identity/website/email templates], resulting in a [X%] increase in [click-through rate/conversions]</li>
</ul>

<h3>[Marketing Specialist / Graphic Designer / Content Creator] | [Company Name] | [City, State] | [Start Date] \u2013 [End Date]</h3>
<ul>
<li>Created and managed social media content calendars across [platforms], growing the combined following by [X%] in [time period]</li>
<li>Produced [X]+ pieces of original content monthly including blog posts, infographics, videos, and email campaigns</li>
<li>Planned and executed a product launch campaign that drove [X]K+ landing page visits and [X]+ qualified leads</li>
<li>Conducted A/B testing on ad creatives and landing pages, improving conversion rates by [X%]</li>
<li>Collaborated with the sales team to develop pitch decks and collateral that contributed to $[X]M in closed deals</li>
</ul>

<h2>Skills</h2>
<p><strong>Design &amp; Creative:</strong> Adobe Creative Suite (Photoshop, Illustrator, InDesign, Premiere Pro) | Figma | Canva | After Effects</p>
<p><strong>Marketing &amp; Analytics:</strong> Google Analytics | SEO/SEM | Email Marketing (Mailchimp, HubSpot) | Social Media Advertising</p>
<p><strong>Content &amp; Strategy:</strong> Copywriting | Brand Strategy | Content Marketing | Campaign Management | A/B Testing</p>
<p><strong>Collaboration:</strong> Asana | Trello | Slack | Notion | Cross-Functional Team Leadership</p>

<h2>Portfolio Highlights</h2>
<ul>
<li><strong>[Project/Campaign Name]:</strong> [Brief description of the campaign, target audience, channels used, and measurable results achieved]</li>
<li><strong>[Project/Campaign Name]:</strong> [Brief description, e.g. "Rebranded a B2B SaaS company, delivering a new visual identity, website, and brand guidelines that improved lead generation by X%"]</li>
<li><strong>[Project/Campaign Name]:</strong> [Brief description, e.g. "Directed a video campaign for product launch that earned X views and was featured in industry publication"]</li>
</ul>

<h2>Education</h2>
<h3>[Degree, e.g. Bachelor of Fine Arts in Graphic Design] | [University Name] | [Graduation Year]</h3>
<p>Relevant Coursework: Visual Communication, Typography, UX Design, Digital Marketing, Brand Management</p>

<h2>Awards &amp; Recognition</h2>
<ul>
<li>[Award Name] \u2013 [Issuing Organization] \u2013 [Year]</li>
<li>[Award Name] \u2013 [Issuing Organization] \u2013 [Year]</li>
</ul>`,
  },
];
