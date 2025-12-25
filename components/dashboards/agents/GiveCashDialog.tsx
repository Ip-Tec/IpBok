"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSession } from 'next-auth/react';

interface Agent {
  id: string;
  name: string | null;
  email: string;
}

interface GiveCashDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId?: string; // Make agentId optional
  onCashGiven: () => void;
}

export function GiveCashDialog({ open, onOpenChange, agentId, onCashGiven }: GiveCashDialogProps) {
    const { data: session } = useSession();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(agentId);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingAgents, setIsLoadingAgents] = useState(false);

    useEffect(() => {
        // If no agentId is provided, fetch all agents for the business
        const fetchAgents = async () => {
            if (!agentId && session?.user?.businessId) {
                setIsLoadingAgents(true);
                try {
                    const response = await fetch(`/api/agents?businessId=${session.user.businessId}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch agents');
                    }
                    const data = await response.json();
                    setAgents(data);
                } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Could not fetch agents.');
                } finally {
                    setIsLoadingAgents(false);
                }
            }
        };

        if (open) {
            fetchAgents();
            setSelectedAgentId(agentId);
            setAmount('');
            setDescription('');
        }
    }, [open, agentId, session?.user?.businessId]);

    const handleSubmit = async () => {
        if (!selectedAgentId) {
            toast.error('Please select an agent.');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/agents/${selectedAgentId}/cash-advance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount,
                    description,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to give cash');
            }

            toast.success('Cash given successfully!');
            onCashGiven();
            onOpenChange(false);
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('An unknown error occurred.');
            }
        } finally {
            setIsSubmitting(false);
        }
    }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Give Cash to Agent</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!agentId && (
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="agent" className="text-right">
                    Agent
                </Label>
                <Select onValueChange={setSelectedAgentId} value={selectedAgentId}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                        {isLoadingAgents ? (
                            <SelectItem value="loading" disabled>Loading agents...</SelectItem>
                        ) : (
                            agents.map(agent => (
                                <SelectItem key={agent.id} value={agent.id}>
                                    {agent.name} ({agent.email})
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              placeholder="Optional: e.g. Morning float"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting || !amount || !selectedAgentId}>
            {isSubmitting ? 'Giving Cash...' : 'Give Cash'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
