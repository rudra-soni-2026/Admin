export interface HeaderTabConfig {
    id: string;
    name: string;
    icon: string;
    color: string;
    header_color?: string;
    // Per-tab Festive Settings
    is_festive_active?: boolean;
    festive_title?: string;
    festive_banner_url?: string;
    festive_text_color?: string;
    festive_start_date?: string;
    festive_end_date?: string;
    festive_type?: string;
    festive_single_banners?: Array<{
        title?: string;
        image: string;
        parent_category_id: string;
        sub_category_id?: string;
        category_id?: string;
    }>; // Should be exactly 4
    festive_multi_banner?: {
        title?: string;
        parent_category_id: string;
        sub_category_id?: string;
        category_id?: string;
        items: Array<{
            image: string;
            product_id: string;
            price?: number;
            original_price?: number;
        }>;
    };
    screen_data?: Array<{
        image: string;
        parent_category_id: string;
        sub_category_id?: string;
        category_id?: string;
    }>;

}

export interface CompanySettings {
    id: string;
    name: string;
    logo_url: string | null;
    favicon_url: string | null;
    loader_logo_url: string | null;
    footer_logo_url: string | null;
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string | null;
    og_image_url: string | null;
    header_bg_color: string;
    header_text_color: string;
    header_bg_image_url: string | null;
    primary_color: string;
    header_tabs_config: HeaderTabConfig[];
    banners: any[];
    header_announcement: string | null;
    gst_percentage: number;
    pan_number: string | null;
    gst_number: string | null;
    cin_number: string | null;
    fssai_license_number: string | null;
    gst_terms_conditions: string | null;
    signature_url: string | null;
    support_email: string | null;
    support_phone: string | null;
    address: string | null;
    about_us: string | null;
    refund_policy: string | null;
    terms_conditions: string | null;
    cancellation_policy: string | null;
    min_order_amount: number;
    is_under_maintenance: boolean;
    delivery_buffer_time: number;
    delivery_time_slots: any[];
    rider_time_slots: any[];
    app_version: string;
    is_force_update: boolean;
    promo_banners: string | null;
    screen_colors: any[];
    spotlight: any[];
    festive_sale?: {
        is_active: boolean;
        title: string;
        banner_url: string;
        accent_color: string;
        start_date?: string;
        end_date?: string;
        tabs?: any[];
    };
    handling_charge_amount: number;
    is_handling_charge_enabled: boolean;
    festive_config: any;
    small_cart_charge_amount: number;
    small_cart_threshold: number;
    is_small_cart_charge_enabled: boolean;
    delivery_charge_amount: number;
    is_delivery_charge_enabled: boolean;
    platform_charge_amount: number;
    is_platform_charge_enabled: boolean;
    secondary_banners: Array<{
        id?: string;
        title: string;
        banners: Array<{
            id?: string;
            image: string;
        }>;
    }>;
    referral_config?: {
        referrer_amount: number;
        referee_amount: number;
        reward_referee: boolean;
        reward_referrer: boolean;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CompanySettingsResponse {
    status: string;
    data: CompanySettings;
    _source?: string;
}
