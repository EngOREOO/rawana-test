import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAppSelector } from '../../app/hooks';

interface Props {
  children: ReactNode;
}

export default function PublicOnlyRoute({ children }: Props) {
  const token = useAppSelector((state) => state.auth.token);

  if (token) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
