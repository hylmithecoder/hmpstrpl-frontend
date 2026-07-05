import { Home } from "./pages/Home";
import { loadSlides } from "./utils/slides";

export default function Page() {
  return <Home slides={loadSlides()} />;
}
