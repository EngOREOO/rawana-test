import ToastHost from './components/common/ToastHost';
import GlobalLoader from './components/common/GlobalLoader';
import AppRouter from './app/router';

export default function App() {
  return (
    <>
      <AppRouter />
      <ToastHost />
      <GlobalLoader />
    </>
  );
}
