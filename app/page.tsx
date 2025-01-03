import Link from 'next/link';
import Image from 'next/image';
import { FaLinkedin, FaGithub, FaEnvelope } from 'react-icons/fa';

export default function HomePage() {
  return (
    <main className="bg-orange-50 text-gray-800">
      {/* Hero Section */}
      <section className="py-20 px-5 shadow-lg shadow-orange-100/70">
        <div className="max-w-4xl mx-auto text-center">
          {/* Headshot */}
          <div className="mb-6">
            <Image
              src="/headshot.jpg" // Add your image to the public folder as "headshot.jpg"
              alt="Profile Headshot"
              className="w-32 h-32 mx-auto rounded-full shadow-lg"
            />
          </div>
          <h1 className="text-4xl font-bold mb-4">Johnny Yeh</h1>
          <h2 className="text-2xl mb-6">Front end Engineer</h2>
          <p className="text-lg mb-8">
            Over 12 years of expertise in React, Redux, and SaaS platforms.
          </p>
          {/* Social Media Icons */}
          <div className="flex justify-center mt-8 gap-6">
            <a
              href="https://www.linkedin.com/in/kai-chen-yeh-9687b869"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-400"
            >
              <FaLinkedin size={30} />
            </a>
            <a
              href="https://github.com/pidashin?tab=repositories" // Replace with your GitHub profile
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-400"
            >
              <FaGithub size={30} />
            </a>
            <a
              href="mailto:bestlove_charlene@hotmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-400"
            >
              <FaEnvelope size={30} />
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 px-5 shadow-lg shadow-orange-100/70">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">About Me</h2>
          <p className="text-lg mb-6 text-left">
            I’m a passionate web developer with extensive front-end expertise,
            specializing in React, Redux, and SaaS development. With years of
            experience leading teams, delivering scalable projects, and
            mentoring developers, I thrive in creating innovative solutions.
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <li className="bg-white p-4 rounded shadow">
              <strong>Top Skills:</strong> React.js, Redux.js, NextJs, Storybook
            </li>
            <li className="bg-white p-4 rounded shadow">
              <strong>Languages:</strong> English (Professional), Chinese
              (Native)
            </li>
          </ul>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-16 px-5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Projects</h2>
          <p className="text-lg mb-8">Check out some of my work below:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Card 1 */}
            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-xl font-bold mb-4">Project 1</h3>
              <p className="text-gray-700 mb-4">
                A brief description of the project.
              </p>
              <Link href="/projects/project1">
                <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                  Learn More
                </button>
              </Link>
            </div>
            {/* Project Card 2 */}
            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-xl font-bold mb-4">Project 2</h3>
              <p className="text-gray-700 mb-4">
                A brief description of the project.
              </p>
              <Link href="/projects/project2">
                <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                  Learn More
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
