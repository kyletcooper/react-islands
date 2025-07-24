import { Island } from "@wrdagency/react-islands";
import { SharedComponent } from "./SharedComponent";

const MyComponentTwo = ({}) => {
	return (
		<div>
			MyComponentTwo: <SharedComponent />
		</div>
	);
};

export default new Island(MyComponentTwo);
