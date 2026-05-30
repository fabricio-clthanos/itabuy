import { motion } from 'motion/react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut'
      }}
      className={`bg-slate-200 rounded ${className}`}
    />
  );
}

export function ProductDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 animate-pulse">
      <Skeleton className="w-full aspect-square rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="w-3/4 h-6" />
        <Skeleton className="w-1/2 h-4" />
      </div>
      <div className="space-y-3 mt-4">
        <Skeleton className="w-full h-10" />
        <Skeleton className="w-full h-10" />
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-2.5 space-y-3 shadow-sm border border-gray-100">
      <Skeleton className="w-full aspect-square rounded-xl" />
      <div className="space-y-2 px-1">
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-2/3 h-3" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function BannerSkeleton() {
  return <Skeleton className="w-full h-36 rounded-xl" />;
}
