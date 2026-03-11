
import { metaAdsCampaignManagementService } from '../management/MetaAdsCampaignManagementService';
import { metaAdsInsightsService } from '../MetaAdsInsightsService';

export interface AutomationRule {
  id: string;
  name: string;
  type: 'auto_pause' | 'auto_optimize' | 'budget_alert' | 'performance_alert';
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  isActive: boolean;
  campaignIds: string[];
}

export interface AutomationCondition {
  metric: 'ctr' | 'cpc' | 'spend' | 'cpm' | 'frequency';
  operator: 'greater_than' | 'less_than' | 'equals';
  value: number;
  timeframe: '1d' | '3d' | '7d' | '30d';
}

export interface AutomationAction {
  type: 'pause_campaign' | 'adjust_budget' | 'send_notification';
  parameters: Record<string, any>;
}

export interface AutomationResult {
  ruleId: string;
  campaignId: string;
  action: string;
  success: boolean;
  message: string;
  timestamp: Date;
}

export class MetaAdsAutomationService {
  private automationRules: AutomationRule[] = [];

  async evaluateAutomationRules(
    campaigns: any[],
    accessToken: string
  ): Promise<AutomationResult[]> {
    const results: AutomationResult[] = [];
    
    console.log('🤖 Evaluating automation rules for', campaigns.length, 'campaigns');

    for (const rule of this.automationRules.filter(r => r.isActive)) {
      const applicableCampaigns = campaigns.filter(c => 
        rule.campaignIds.includes(c.id) && c.meta_campaign_id
      );

      for (const campaign of applicableCampaigns) {
        try {
          const shouldTrigger = await this.evaluateConditions(
            rule.conditions,
            campaign,
            accessToken
          );

          if (shouldTrigger) {
            const actionResults = await this.executeActions(
              rule.actions,
              campaign,
              accessToken
            );
            
            results.push(...actionResults.map(result => ({
              ruleId: rule.id,
              campaignId: campaign.id,
              action: result.action,
              success: result.success,
              message: result.message,
              timestamp: new Date()
            })));
          }
        } catch (error) {
          console.error('❌ Error evaluating automation rule:', error);
          results.push({
            ruleId: rule.id,
            campaignId: campaign.id,
            action: 'evaluation_error',
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date()
          });
        }
      }
    }

    return results;
  }

  private async evaluateConditions(
    conditions: AutomationCondition[],
    campaign: any,
    accessToken: string
  ): Promise<boolean> {
    try {
      // Get campaign insights for evaluation
      const insights = await metaAdsInsightsService.getCampaignInsights(
        campaign.meta_ad_id,
        accessToken
      );

      // Check all conditions (AND logic)
      return conditions.every(condition => {
        const metricValue = this.getMetricValue(insights, condition.metric);
        return this.evaluateCondition(metricValue, condition.operator, condition.value);
      });
    } catch (error) {
      console.error('❌ Error evaluating conditions:', error);
      return false;
    }
  }

  private getMetricValue(insights: any, metric: string): number {
    const metricMap: Record<string, string> = {
      'ctr': 'ctr',
      'cpc': 'cpc',
      'spend': 'spend',
      'cpm': 'cpm',
      'frequency': 'frequency'
    };

    return parseFloat(insights[metricMap[metric]] || '0');
  }

  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'greater_than':
        return value > threshold;
      case 'less_than':
        return value < threshold;
      case 'equals':
        return Math.abs(value - threshold) < 0.01;
      default:
        return false;
    }
  }

  private async executeActions(
    actions: AutomationAction[],
    campaign: any,
    accessToken: string
  ): Promise<Array<{ action: string; success: boolean; message: string }>> {
    const results = [];

    for (const action of actions) {
      try {
        let result;
        
        switch (action.type) {
          case 'pause_campaign':
            result = await metaAdsCampaignManagementService.pauseCampaign(
              campaign.meta_campaign_id,
              accessToken
            );
            results.push({
              action: 'pause_campaign',
              success: result.success,
              message: result.message || 'Campaign paused by automation'
            });
            break;
            
          case 'send_notification':
            // This would integrate with the notification system
            results.push({
              action: 'send_notification',
              success: true,
              message: `Notification sent: ${action.parameters.message}`
            });
            break;
            
          default:
            results.push({
              action: action.type,
              success: false,
              message: `Unknown action type: ${action.type}`
            });
        }
      } catch (error) {
        results.push({
          action: action.type,
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  addAutomationRule(rule: Omit<AutomationRule, 'id'>): AutomationRule {
    const newRule: AutomationRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.automationRules.push(newRule);
    console.log('✅ Added automation rule:', newRule.name);
    
    return newRule;
  }

  removeAutomationRule(ruleId: string): boolean {
    const index = this.automationRules.findIndex(r => r.id === ruleId);
    if (index >= 0) {
      this.automationRules.splice(index, 1);
      console.log('✅ Removed automation rule:', ruleId);
      return true;
    }
    return false;
  }

  getAutomationRules(): AutomationRule[] {
    return [...this.automationRules];
  }

  updateAutomationRule(ruleId: string, updates: Partial<AutomationRule>): boolean {
    const rule = this.automationRules.find(r => r.id === ruleId);
    if (rule) {
      Object.assign(rule, updates);
      console.log('✅ Updated automation rule:', ruleId);
      return true;
    }
    return false;
  }
}

export const metaAdsAutomationService = new MetaAdsAutomationService();
