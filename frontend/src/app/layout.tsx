import "./globals.css";
import "reactflow/dist/style.css"; // ADD THIS LINE
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Intelligent User Flow Mapper",
	description: "Analyze websites and visualize user navigation flows",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className="bg-gray-50">{children}</body>
		</html>
	);
}
