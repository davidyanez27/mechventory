
export const LoadingSpinner = () => {
  return (
    <div className="flex h-full w-full min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-lg font-medium">Loading...</p>
      </div>
    </div>
  );
};