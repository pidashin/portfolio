import Link from 'next/link';

export default function ProjectsPage() {
  return (
    <main>
      <h1>Projects</h1>
      <p>Here are some of my side projects and demos.</p>
      <Link href="/projects/wordbridge">WordBridge</Link>
      <br />
      <Link href="/projects/quiz-viewer">Quiz Viewer</Link>
    </main>
  );
}
