import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { getInviteDetails, registerViaInvite } from '../api/invitations';
import useAuthStore from '../store/authStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const InviteSignupPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [inviteData, setInviteData] = useState(null);
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      setIsValidating(true);
      const data = await getInviteDetails(token);
      setInviteData(data);
    } catch (err) {
      setValidationError(err.response?.data?.error || 'Invalid or expired invitation');
    } finally {
      setIsValidating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      const data = await registerViaInvite({
        token,
        name: formData.name,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      // Auto-login
      localStorage.setItem('token', data.token);
      useAuthStore.setState({ 
        user: data.user, 
        isAuthenticated: true, 
        isLoading: false 
      });

      toast.success('Account created! Welcome to the team 🎉');
      
      // Navigate to the project they were invited to
      navigate(`/projects/${data.projectId}`, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already logged in, redirect
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
        <div className="max-w-md w-full bg-bg-secondary p-8 rounded-xl border border-border shadow-2xl text-center">
          <Layout className="mx-auto h-8 w-8 text-accent mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">You're already logged in</h2>
          <p className="text-sm text-text-secondary mb-6">
            You're already signed in to TaskFlow. Head to your dashboard to see your projects.
          </p>
          <Button onClick={() => navigate('/dashboard')} className="w-full">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-accent animate-spin" />
          <p className="text-text-secondary text-sm">Validating your invitation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (validationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
        <div className="max-w-md w-full bg-bg-secondary p-8 rounded-xl border border-border shadow-2xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 mb-4">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Invitation Invalid</h2>
          <p className="text-sm text-text-secondary mb-6">{validationError}</p>
          <div className="space-y-3">
            <Link to="/register">
              <Button className="w-full">Create a Regular Account</Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" className="w-full mt-2">Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Signup form
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-bg-secondary p-8 rounded-xl border border-border shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <Layout className="h-6 w-6 text-accent" />
          </div>
          <h2 className="mt-6 text-2xl font-extrabold text-text-primary">
            Join the team!
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            <strong className="text-text-primary">{inviteData.invitedBy}</strong> invited you to collaborate on{' '}
            <strong className="text-accent">"{inviteData.projectName}"</strong>
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {/* Email (read-only) */}
          <Input
            label="Email Address"
            type="email"
            value={inviteData.email}
            disabled
            className="opacity-60 cursor-not-allowed"
          />

          <Input
            label="Full Name"
            id="invite-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Your full name"
            autoFocus
          />

          <Input
            label="Password"
            id="invite-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="At least 8 characters"
          />

          <Input
            label="Confirm Password"
            id="invite-confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your password"
          />

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Create Account & Join Project
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary mt-4">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent hover:text-accent-hover">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default InviteSignupPage;
