import {
	type Submission,
	conform,
	useFieldset,
	useForm,
	parse,
} from '@conform-to/react';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { Playground, Field, Alert } from '~/components';
import { parseConfig } from '~/config';

interface Login {
	email: string;
	password: string;
}

function validate(formData: FormData): Submission<Login> {
	const submission = parse<Login>(formData);

	if (!submission.value.email) {
		submission.error.push(['email', 'Email is required']);
	}

	if (!submission.value.password) {
		submission.error.push(['password', 'Password is required']);
	}

	return submission;
}

export let loader = async ({ request }: LoaderArgs) => {
	return parseConfig(request);
};

export let action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const submission = validate(formData);

	if (
		submission.error.length === 0 &&
		(submission.value.email !== 'me@edmund.dev' ||
			submission.value.password !== '$eCreTP@ssWord')
	) {
		submission.error.push(['', 'The provided email or password is not valid']);
	}

	return {
		...submission,
		value: {
			email: submission.value.email,
			// Never send the password back to the client
		},
	};
};

export default function LoginForm() {
	const config = useLoaderData();
	const state = useActionData();
	const form = useForm<Login>({
		...config,
		state,
		onValidate: config.validate
			? ({ formData }) => validate(formData)
			: undefined,
		onSubmit:
			config.mode === 'server-validation'
				? (event, { submission }) => {
						if (submission.type === 'validate') {
							event.preventDefault();
						}
				  }
				: undefined,
	});
	const { email, password } = useFieldset(form.ref, form.config);

	return (
		<Form method="post" {...form.props}>
			<Playground title="Login Form" state={state}>
				<Alert message={form.error} />
				<Field label="Email" error={email.error}>
					<input
						{...conform.input(email.config, { type: 'email' })}
						autoComplete="off"
					/>
				</Field>
				<Field label="Password" error={password.error}>
					<input {...conform.input(password.config, { type: 'password' })} />
				</Field>
			</Playground>
		</Form>
	);
}
