import { Island } from "@wrdagency/react-islands";
import { SharedComponent } from "./SharedComponent";

const MyComponentOne = ({}) => {
	return (
		<div>
			MyComponentOne: <SharedComponent />
		</div>
	);
};

export default new Island(MyComponentOne);
