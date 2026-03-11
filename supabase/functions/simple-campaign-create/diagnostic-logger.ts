// ========================================
// 📊 DIAGNOSTIC LOGGER FOR CAMPAIGN CREATION
// ========================================

export interface DiagnosticData {
  stage: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

export class DiagnosticLogger {
  private logs: DiagnosticData[] = [];
  private startTime: number = Date.now();

  log(level: 'info' | 'warn' | 'error', stage: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logPrefix = `[${timestamp}][simple-campaign-create][${stage.toUpperCase()}]`;
    
    const diagnosticData: DiagnosticData = {
      stage,
      level,
      message,
      data
    };
    
    this.logs.push(diagnosticData);
    
    switch (level) {
      case 'info':
        if (data) {
          console.log(`${logPrefix} ${message}`, data);
        } else {
          console.log(`${logPrefix} ${message}`);
        }
        break;
      case 'error':
        if (data) {
          console.error(`${logPrefix} ❌ ${message}`, data);
        } else {
          console.error(`${logPrefix} ❌ ${message}`);
        }
        break;
      case 'warn':
        if (data) {
          console.warn(`${logPrefix} ⚠️ ${message}`, data);
        } else {
          console.warn(`${logPrefix} ⚠️ ${message}`);
        }
        break;
    }
  }

  generateDiagnosticReport(payload: any, integration: any, error?: any): string {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    const report = {
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      campaign_creation_flow: payload?.creativeType || 'unknown',
      total_logs: this.logs.length,
      error_logs: this.logs.filter(log => log.level === 'error').length,
      warn_logs: this.logs.filter(log => log.level === 'warn').length,
      
      // Frontend Analysis
      frontend_data: {
        creativeType: payload?.creativeType,
        useExistingInstagramPost: payload?.useExistingInstagramPost,
        selectedInstagramPostId: payload?.selectedInstagramPostId,
        object_story_id: payload?.object_story_id,
        instagram_actor_id_from_payload: payload?.instagram,
        fanpage_id: payload?.fanpage,
        hasSelectedMediaMeta: !!payload?.selectedMediaMeta,
        selectedMediaMeta: payload?.selectedMediaMeta ? {
          file_type: payload.selectedMediaMeta.file_type,
          filename: payload.selectedMediaMeta.filename,
          hasPublicUrl: !!payload.selectedMediaMeta.public_url
        } : null
      },
      
      // Integration Analysis
      integration_analysis: integration ? {
        provider: integration.provider,
        status: integration.status,
        ad_account_id: integration.ad_account_id,
        page_id: integration.page_id,
        hasAccessToken: !!integration.access_token,
        selected_pages: integration.selected_pages || [],
        selected_accounts: integration.selected_accounts || []
      } : null,
      
      // Flow Decision Analysis
      flow_analysis: {
        is_upload_flow: payload?.creativeType === 'upload',
        is_existing_post_flow: payload?.creativeType === 'post' || payload?.useExistingInstagramPost,
        should_validate_instagram: payload?.creativeType === 'upload' && !!payload?.instagram,
        expected_instagram_actor_id: payload?.instagram,
        flow_decision: payload?.creativeType === 'upload' ? 'UPLOAD_CREATIVE_FLOW' : 'EXISTING_POST_FLOW'
      },
      
      // Error Analysis
      error_analysis: error ? {
        error_message: error.message,
        error_type: error.constructor.name,
        is_instagram_actor_id_error: error.message?.includes('instagram_actor_id'),
        is_invalid_parameter_error: error.message?.includes('Invalid parameter'),
        possible_causes: this.generatePossibleCauses(error, payload, integration)
      } : null,
      
      // All diagnostic logs
      detailed_logs: this.logs,
      
      // Conclusions and Recommendations
      conclusions: this.generateConclusions(payload, integration, error)
    };
    
    console.log('📊 [DIAGNOSTIC REPORT] Complete Analysis:', report);
    return JSON.stringify(report, null, 2);
  }
  
  private generatePossibleCauses(error: any, payload: any, integration: any): string[] {
    const causes = [];
    
    if (error.message?.includes('instagram_actor_id')) {
      causes.push('Instagram Actor ID is invalid or not connected to the page');
      causes.push('Instagram ID may not exist in Meta system');
      causes.push('Instagram account may not be connected to the Facebook page');
      causes.push('Access token may not have permissions for this Instagram account');
    }
    
    if (error.message?.includes('Invalid parameter')) {
      causes.push('One or more parameters in the creative request are invalid');
      causes.push('Image hash may be from a different ad account');
      causes.push('Object story spec structure may be incorrect');
    }
    
    if (error.message?.includes('image_hash')) {
      causes.push('Image hash is invalid or from different ad account');
      causes.push('Image upload may have failed silently');
    }
    
    if (payload?.creativeType === 'upload' && !payload?.selectedMediaMeta) {
      causes.push('Upload mode selected but no media file provided');
    }
    
    if (!integration?.access_token) {
      causes.push('Missing or invalid access token');
    }
    
    return causes;
  }
  
  private generateConclusions(payload: any, integration: any, error?: any): string[] {
    const conclusions = [];
    
    // Flow Analysis
    if (payload?.creativeType === 'upload') {
      conclusions.push('Campaign is using UPLOAD creative flow');
      
      if (payload?.instagram) {
        conclusions.push(`Instagram Actor ID (${payload.instagram}) should be validated before adding to creative`);
      } else {
        conclusions.push('No Instagram Actor ID provided - creative will be Facebook-only');
      }
      
      if (payload?.selectedMediaMeta) {
        conclusions.push(`Media file provided: ${payload.selectedMediaMeta.file_type} - ${payload.selectedMediaMeta.filename}`);
      } else {
        conclusions.push('WARNING: Upload mode but no media file provided');
      }
    } else {
      conclusions.push('Campaign is using EXISTING POST creative flow');
      
      if (payload?.object_story_id) {
        conclusions.push(`Using object_story_id: ${payload.object_story_id}`);
      } else {
        conclusions.push('WARNING: Existing post mode but no object_story_id provided');
      }
    }
    
    // Error Analysis
    if (error) {
      if (error.message?.includes('instagram_actor_id')) {
        conclusions.push('CRITICAL: Instagram Actor ID validation failed');
        conclusions.push('RECOMMENDATION: Validate Instagram connection before creative creation');
      }
      
      if (error.message?.includes('image_hash')) {
        conclusions.push('CRITICAL: Image hash validation failed');
        conclusions.push('RECOMMENDATION: Ensure image upload uses correct ad account and access token');
      }
    }
    
    // Integration Analysis
    if (integration) {
      conclusions.push(`Integration found: ${integration.provider} (${integration.status})`);
      conclusions.push(`Using ad account: ${integration.ad_account_id}`);
      conclusions.push(`Using page: ${integration.page_id}`);
    } else {
      conclusions.push('CRITICAL: No Meta integration found');
    }
    
    return conclusions;
  }
}

export function createDiagnosticLogger(): DiagnosticLogger {
  return new DiagnosticLogger();
}