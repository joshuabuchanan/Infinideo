import { FormSection } from "../sections/form-section";

interface VideoViewProps {
  videoId: string;
}

export const VideoView = ({ videoId }: VideoViewProps) => {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-2.5 sm:px-6 lg:px-8">
      <FormSection videoId={videoId} />
    </div>
  );
};
