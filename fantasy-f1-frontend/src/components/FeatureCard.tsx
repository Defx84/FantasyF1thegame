import { IconType } from 'react-icons';

interface FeatureCardProps {
  icon: IconType;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => {
  if (!Icon) return null;

  const TypedIcon = Icon as unknown as React.FC<{ size?: number; className?: string }>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <TypedIcon size={32} className="text-primary mb-4" />
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default FeatureCard; 