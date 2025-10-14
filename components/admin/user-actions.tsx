"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { User } from "@/lib/types";
import { DropdownMenuItem } from "../ui/dropdown-menu";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { format } from "date-fns";

// --- Create User ---
const createUserSchema = z.object({
	username: z.string().min(1, "Username is required"),
	nickname: z.string().min(1, "Nickname is required"),
	password: z.string().min(6, "Password must be at least 6 characters"),
});

export function CreateUserDialog({ onUserCreated }: { onUserCreated: () => void }) {
	const [open, setOpen] = useState(false);
	const { toast } = useToast();
	const form = useForm<z.infer<typeof createUserSchema>>({ resolver: zodResolver(createUserSchema), defaultValues: { username: '', nickname: '', password: '' } });

	const onSubmit = async (values: z.infer<typeof createUserSchema>) => {
		try {
			await api.post('/users', values);
			toast({ title: "User Created", description: `User ${values.username} has been created.` });
			onUserCreated();
			setOpen(false);
			form.reset();
		} catch (err: any) {
			toast({ variant: "destructive", title: "Creation Failed", description: err.response?.data?.message });
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild><Button>Create User</Button></DialogTrigger>
			<DialogContent>
				<DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField control={form.control} name="username" render={({ field }) => (<FormItem><FormLabel>Username</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
						<FormField control={form.control} name="nickname" render={({ field }) => (<FormItem><FormLabel>Nickname</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
						<FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
						<DialogFooter><Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Creating..." : "Create"}</Button></DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

// --- Edit User ---
const editUserSchema = z.object({
	nickname: z.string().min(1, "Nickname is required"),
	signature: z.string().optional(),
    ban_reason: z.string().optional(),
    banned_until: z.string().optional(),
});
export function EditUserDialog({ user, onUserUpdated }: { user: User, onUserUpdated: () => void }) {
	const [open, setOpen] = useState(false);
	const { toast } = useToast();
	const form = useForm<z.infer<typeof editUserSchema>>({
		resolver: zodResolver(editUserSchema),
		defaultValues: {
            nickname: user.nickname,
            signature: user.signature || '',
            ban_reason: user.ban_reason || '',
            banned_until: user.banned_until ? format(new Date(user.banned_until), "yyyy-MM-dd'T'HH:mm") : '',
        },
	});

    useEffect(() => {
        if (open) {
            form.reset({
                nickname: user.nickname,
                signature: user.signature || '',
                ban_reason: user.ban_reason || '',
                banned_until: user.banned_until ? format(new Date(user.banned_until), "yyyy-MM-dd'T'HH:mm") : '',
            });
        }
    }, [open, user, form]);

	const onSubmit = async (values: z.infer<typeof editUserSchema>) => {
        const payload: any = {
            nickname: values.nickname,
            signature: values.signature,
            ban_reason: values.ban_reason,
        };
        // Handle time: convert local time to ISO string for backend, or send empty string to unban
        if (values.banned_until) {
            payload.banned_until = new Date(values.banned_until).toISOString();
        } else {
            payload.banned_until = ""; // Signal to backend to unban
        }

		try {
			await api.patch(`/users/${user.id}`, payload);
			toast({ title: "User Updated", description: "User profile has been updated." });
			onUserUpdated();
			setOpen(false);
		} catch (err: any) {
			toast({ variant: "destructive", title: "Update Failed", description: err.response?.data?.message });
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild><span className="w-full text-left">Edit Profile</span></DialogTrigger>
			<DialogContent>
				<DialogHeader><DialogTitle>Edit Profile for @{user.username}</DialogTitle></DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField control={form.control} name="nickname" render={({ field }) => (<FormItem><FormLabel>Nickname</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
						<FormField control={form.control} name="signature" render={({ field }) => (<FormItem><FormLabel>Signature</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />

                        <Separator className="my-4" />
                        <h3 className="text-lg font-semibold">Ban Controls</h3>
                        <p className="text-sm text-muted-foreground">To unban a user, clear the "Banned Until" date.</p>
                        <FormField control={form.control} name="banned_until" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Banned Until</FormLabel>
                                <FormControl><Input type="datetime-local" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="ban_reason" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ban Reason</FormLabel>
                                <FormControl><Textarea {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

						<DialogFooter><Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Saving..." : "Save Changes"}</Button></DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}


// --- Reset Password ---
const resetPasswordSchema = z.object({ password: z.string().min(6, "Password must be at least 6 characters") });
export function ResetPasswordDialog({ userId }: { userId: string }) {
	const [open, setOpen] = useState(false);
	const { toast } = useToast();
	const form = useForm<z.infer<typeof resetPasswordSchema>>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: '' } });

	const onSubmit = async (values: z.infer<typeof resetPasswordSchema>) => {
		try {
			await api.post(`/users/${userId}/reset-password`, values);
			toast({ title: "Password Reset", description: "User's password has been successfully reset." });
			setOpen(false);
			form.reset();
		} catch (err: any) {
			toast({ variant: "destructive", title: "Reset Failed", description: err.response?.data?.message });
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild><span className="w-full text-left">Reset Password</span></DialogTrigger>
			<DialogContent>
				<DialogHeader><DialogTitle>Reset Password</DialogTitle></DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
						<DialogFooter><Button type="submit" disabled={form.formState.isSubmitting}>Set New Password</Button></DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

// --- Register for Contest ---
const registerContestSchema = z.object({ contest_id: z.string().min(1, "Contest ID is required") });
export function RegisterContestDialog({ userId }: { userId: string }) {
	const [open, setOpen] = useState(false);
	const { toast } = useToast();
	const form = useForm<z.infer<typeof registerContestSchema>>({ resolver: zodResolver(registerContestSchema), defaultValues: { contest_id: '' } });

	const onSubmit = async (values: z.infer<typeof registerContestSchema>) => {
		try {
			await api.post(`/users/${userId}/register-contest`, values);
			toast({ title: "Registration Successful", description: `User has been registered for contest ${values.contest_id}.` });
			setOpen(false);
			form.reset();
		} catch (err: any) {
			toast({ variant: "destructive", title: "Registration Failed", description: err.response?.data?.message });
		}
	};
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild><span className="w-full text-left">Register for Contest</span></DialogTrigger>
			<DialogContent>
				<DialogHeader><DialogTitle>Register User for Contest</DialogTitle></DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField control={form.control} name="contest_id" render={({ field }) => (<FormItem><FormLabel>Contest ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
						<DialogFooter><Button type="submit" disabled={form.formState.isSubmitting}>Register</Button></DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

// --- Delete User ---
export function DeleteUserMenuItem({ userId, onUserDeleted }: { userId: string, onUserDeleted: () => void }) {
	const { toast } = useToast();
	const handleDelete = async () => {
		if (confirm("Are you sure you want to delete this user? This action is irreversible.")) {
			try {
				await api.delete(`/users/${userId}`);
				toast({ title: "User Deleted" });
				onUserDeleted();
			} catch (err: any) {
				toast({ variant: "destructive", title: "Deletion Failed", description: err.response?.data?.message });
			}
		}
	};
	return <DropdownMenuItem className="text-destructive" onClick={handleDelete}>Delete User</DropdownMenuItem>;
}